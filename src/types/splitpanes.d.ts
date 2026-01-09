declare module 'splitpanes' {
  import { DefineComponent } from 'vue'

  export interface SplitpanesProps {
    horizontal?: boolean
    pushOtherPanes?: boolean
    dblClickSplitter?: boolean
    rtl?: boolean | 'auto'
    firstSplitter?: boolean
  }

  export interface PaneProps {
    size?: number
    minSize?: number
    maxSize?: number
  }

  export interface ResizeEvent {
    size: number
  }

  export const Splitpanes: DefineComponent<SplitpanesProps>
  export const Pane: DefineComponent<PaneProps>
}
