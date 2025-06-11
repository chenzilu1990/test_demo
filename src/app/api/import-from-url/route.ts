import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';
import { ExtendedPromptTemplate } from '@/app/prompt-template-settings/types';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper to validate URL
const isValidUrl = (urlString: string): boolean => {
  try {
    // Use a more robust regex for URL validation, allowing for localhost
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name or localhost
    'localhost|'+
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(urlString);
  } catch (e) {
    return false;
  }
};

async function parseWithAI(content: string, url: string): Promise<Omit<ExtendedPromptTemplate, 'id' | 'createdAt' | 'usageCount' | 'lastUsedAt' | 'tags'>[]> {
  if (!process.env.OPENAI_API_KEY) {
    // Throw a specific error if the key is not configured.
    throw new Error('服务器未配置OpenAI API密钥。请检查.env.local文件。');
  }

  try {
    const $ = cheerio.load(content);
    // Remove script, style, nav, footer, header to reduce noise
    $('script, style, nav, footer, header, aside').remove();
    const bodyText = $('body').text().replace(/\s\s+/g, ' ').trim();

    if (bodyText.length < 100) {
      console.log('Not enough text content for AI parsing.');
      return [];
    }

    console.log(`--- Calling AI to parse URL: ${url} ---`);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
      messages: [
        {
          role: 'system',
          content: `You are an expert assistant that extracts prompt templates from raw text content of a webpage. Analyze the provided text and identify any potential prompts. Return the result as a JSON array of objects, where each object has a "title" and a "prompt" key. The title should be a concise summary of the prompt's purpose. The prompt should be the full text of the prompt. If no prompts are found, return an empty array. Do not include any explanatory text in your response, only the JSON array.
          
Example response:
[
  {
    "title": "Amazon Listing Generator",
    "prompt": "As an Amazon operations expert, please imitate this competitor's Amazon product description..."
  },
  {
    "title": "Consumer Behavior Prediction",
    "prompt": "I want to know your prediction of consumer behavior in [Country] for [Product]..."
  }
]`
        },
        {
          role: 'user',
          content: `Here is the text content from the URL ${url}:\n\n---\n\n${bodyText.substring(0, 8000)}` // Limit to ~8k chars to be safe
        }
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0]?.message?.content;
    if (!resultText) return [];

    const jsonResult = JSON.parse(resultText);
    
    // The response might be {"prompts": [...]} or just [...]
    const prompts = jsonResult.prompts || jsonResult;

    if (Array.isArray(prompts) && prompts.every(p => p.title && p.prompt)) {
      console.log(`--- AI parsing successful, found ${prompts.length} prompts. ---`);
      return prompts.map((p: any) => ({
        title: `[AI] ${p.title}`,
        prompt: p.prompt,
        parameterOptions: p.parameterOptions
      }));
    }
    return [];

  } catch (error: any) {
    console.error('Error during AI parsing:', error);
    // Rethrow a more user-friendly error to be sent to the client.
    throw new Error(`调用AI服务时发生错误: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string' || !isValidUrl(url)) {
      return NextResponse.json({ message: '无效或格式不正确的URL' }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        // Using a common user-agent to avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      return NextResponse.json({ message: `无法获取URL内容，状态码: ${response.status}` }, { status: response.status });
    }
    
    const rawContent = await response.text();
    const contentType = response.headers.get('content-type') || '';
    
    const $ = cheerio.load(rawContent);
    const title = $('title').text() || $('h1').first().text();
    const description = $('meta[name="description"]').attr('content');

    const parsedPrompts: Omit<ExtendedPromptTemplate, 'id' | 'createdAt' | 'usageCount' | 'lastUsedAt' | 'tags'>[] = [];
    
    // Heuristic 1: Look for <pre> tags
    const preCount = $('pre').length;
    $('pre').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 20 && text.length < 10000) { // Relaxed filter for content length
            parsedPrompts.push({
                title: `来自 <pre> #${i + 1} - ${text.substring(0, 30)}...`,
                prompt: text,
            });
        }
    });

    // Heuristic 2: Look for <blockquote> tags
    const blockquoteCount = $('blockquote').length;
    $('blockquote').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 20 && text.length < 10000) { // Relaxed filter
            parsedPrompts.push({
                title: `来自 <blockquote> #${i + 1} - ${text.substring(0, 30)}...`,
                prompt: text,
            });
        }
    });
    
    // Heuristic 3: Specific rule for amz123.com
    if (url.includes('amz123.com/tools-prompt')) {
        
      // This selector targets the container for each prompt on that specific page.
      // It was determined by inspecting the page's HTML structure.
      $('h5:contains("热门指令")').nextAll('div').first().find('a > div').each((i, el) => {
        const title = $(el).find('div').first().text().trim();
        const prompt = $(el).find('div').last().text().trim();

        if (title && prompt && prompt.length > 20) {
          // Check for duplicates before adding
          if (!parsedPrompts.some(p => p.prompt === prompt)) {
            parsedPrompts.push({
              title: title,
              prompt: prompt,
            });
          }
        }
      });
    }

    // Heuristic 4: Handle JSON content if it's an array of templates
    let isJson = false;
    if (contentType.includes('application/json')) {
        isJson = true;
        try {
            const json = JSON.parse(rawContent);
            if (Array.isArray(json) && json.every(item => item.prompt)) {
                 const templates = json.map((p, i) => ({ 
                     title: p.title || `来自 JSON 的提示 #${i+1}`, 
                     prompt: p.prompt,
                     parameterOptions: p.parameterOptions
                 }));
                 parsedPrompts.push(...templates);
            }
        } catch (e) {
            // Not a valid json, do nothing
        }
    }

    // Fallback to AI parsing if no prompts were found
    if (parsedPrompts.length === 0) {
      try {
        console.log("No prompts found with standard heuristics, attempting AI parsing...");
        const aiPrompts = await parseWithAI(rawContent, url);
        console.log("aiPrompts=======", aiPrompts);
        parsedPrompts.push(...aiPrompts);
      } catch (aiError: any) {
        // AI parsing itself failed (e.g., missing key, OpenAI API error)
        // Return a specific error response to the client.
        return NextResponse.json({ success: false, message: aiError.message }, { status: 500 });
      }
    }
    
    // Remove duplicates based on prompt content
    const uniquePrompts = Array.from(new Map(parsedPrompts.map(p => [p.prompt, p])).values());

    // After all attempts, check if we have something
    if (uniquePrompts.length === 0) {
      // Log for debugging
      console.log('--- URL Import Debug (Final) ---');
      console.log('URL:', url);
      console.log('Content-Type:', contentType);
      console.log('Was JSON:', isJson);
      console.log('Found <pre> tags:', preCount);
      console.log('Found <blockquote> tags:', blockquoteCount);
      console.log('--- Raw Content Snippet (first 500 chars) ---');
      console.log(rawContent);
      console.log('--- End of Debug ---');
      
      // Return a clear "not found" message
      return NextResponse.json({ 
        success: false, 
        message: '解析失败：在该URL未找到任何可识别的提示词，AI也无法解析。请确认URL内容或尝试其他页面。' 
      }, { status: 200 });
    }

    return NextResponse.json({ 
        success: true,
        message: `成功解析页面: ${title || '无标题'}`,
        data: {
            sourceTitle: title,
            sourceDescription: description,
            prompts: uniquePrompts.slice(0, 50) // Limit to 50 prompts
        }
     }, { status: 200 });

  } catch (error: any) {
    console.error('导入URL时出错:', error);
    return NextResponse.json({ message: '服务器在处理导入请求时发生内部错误。' }, { status: 500 });
  }
} 