import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { COMMAND_PRIORITY_LOW, KEY_ENTER_COMMAND } from 'lexical';

interface KeyboardPluginProps {
  onEnterPress?: (event: KeyboardEvent) => void;
}

export default function KeyboardPlugin({ onEnterPress }: KeyboardPluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeEnterListener = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        if (event && !event.shiftKey && onEnterPress) {
          event.preventDefault();
          onEnterPress(event);
          return true;
        }
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      removeEnterListener();
    };
  }, [editor, onEnterPress]);

  return null;
}