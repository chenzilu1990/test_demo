// TextDiffUtils.ts
// 提取文本差异计算相关工具函数

export function findCommonSubstrings(oldText: string, newText: string) {
  // 创建一个二维数组来存储最长公共子序列的长度
  const dp: number[][] = Array(oldText.length + 1)
    .fill(0)
    .map(() => Array(newText.length + 1).fill(0));
  
  // 计算最长公共子序列
  for (let i = 1; i <= oldText.length; i++) {
    for (let j = 1; j <= newText.length; j++) {
      if (oldText[i - 1] === newText[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  // 提取公共子串和它们在文本中的位置
  const commonSubstrings: { 
    text: string; 
    oldIndex: number; 
    newIndex: number;
    length: number;
  }[] = [];
  
  let i = oldText.length, j = newText.length;
  while (i > 0 && j > 0) {
    if (oldText[i - 1] === newText[j - 1]) {
      // 找到匹配字符，向前尝试找最长的匹配子串
      let subStart = i - 1;
      let matchLength = 1;
      let k = 1;
      
      while (subStart - k >= 0 && j - k - 1 >= 0 && 
             oldText[subStart - k] === newText[j - k - 1]) {
        matchLength++;
        k++;
      }
      
      // 记录找到的子串
      const substringText = oldText.substring(subStart - matchLength + 1, subStart + 1);
      commonSubstrings.unshift({
        text: substringText,
        oldIndex: subStart - matchLength + 1,
        newIndex: j - matchLength,
        length: matchLength
      });
      
      // 回溯
      i -= matchLength;
      j -= matchLength;
    } else if (dp[i][j - 1] > dp[i - 1][j]) {
      j--;
    } else {
      i--;
    }
  }
  
  // 合并相邻或接近的子串
  const mergedSubstrings: typeof commonSubstrings = [];
  for (let i = 0; i < commonSubstrings.length; i++) {
    const current = commonSubstrings[i];
    if (i === 0 || 
        (current.oldIndex - (commonSubstrings[i-1].oldIndex + commonSubstrings[i-1].length) > 3) ||
        (current.newIndex - (commonSubstrings[i-1].newIndex + commonSubstrings[i-1].length) > 3)) {
      mergedSubstrings.push(current);
    } else {
      // 合并相邻子串
      const prev = mergedSubstrings.pop()!;
      const gap = current.oldIndex - (prev.oldIndex + prev.length);
      const mergedText = prev.text + oldText.substring(prev.oldIndex + prev.length, current.oldIndex + current.length);
      mergedSubstrings.push({
        text: mergedText,
        oldIndex: prev.oldIndex,
        newIndex: prev.newIndex,
        length: prev.length + gap + current.length
      });
    }
  }
  
  return mergedSubstrings;
}

export function computeTextDiff(oldText: string, newText: string) {
  const commonParts = findCommonSubstrings(oldText, newText);
  
  // 创建修改映射表
  const offsetMap = new Map<number, number>();
  
  // 初始化所有旧位置的映射
  for (let i = 0; i <= oldText.length; i++) {
    offsetMap.set(i, -1); // -1表示这个位置在新文本中可能已被删除
  }
  
  // 使用找到的公共部分来建立位置映射
  commonParts.forEach(part => {
    // 对公共部分中的每个位置建立映射
    for (let i = 0; i < part.length; i++) {
      offsetMap.set(part.oldIndex + i, part.newIndex + i);
    }
  });
  
  // 计算不在公共部分中的旧位置的映射
  let lastMappedOldPos = -1;
  let lastMappedNewPos = -1;
  
  for (let i = 0; i <= oldText.length; i++) {
    const mappedPos = offsetMap.get(i);
    if (mappedPos !== undefined && mappedPos !== -1) {
      // 找到了映射点
      lastMappedOldPos = i;
      lastMappedNewPos = mappedPos;
    } else if (lastMappedOldPos !== -1) {
      // 在两个映射点之间的位置
      // 计算到下一个映射点的距离
      let nextMappedOldPos = -1;
      let nextMappedNewPos = -1;
      
      for (let j = i + 1; j <= oldText.length; j++) {
        const nextPos = offsetMap.get(j);
        if (nextPos !== undefined && nextPos !== -1) {
          nextMappedOldPos = j;
          nextMappedNewPos = nextPos;
          break;
        }
      }
      
      if (nextMappedOldPos !== -1) {
        // 使用线性插值来估计此位置的映射
        const progress = (i - lastMappedOldPos) / (nextMappedOldPos - lastMappedOldPos);
        const estimatedPos = Math.round(lastMappedNewPos + progress * (nextMappedNewPos - lastMappedNewPos));
        offsetMap.set(i, estimatedPos);
      } else {
        // 没有下一个映射点，可能是末尾
        offsetMap.set(i, lastMappedNewPos + (i - lastMappedOldPos));
      }
    }
  }
  
  return offsetMap;
}
