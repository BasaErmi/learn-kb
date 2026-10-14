/** 页内跳转。HashRouter 占用了 location.hash，不能用 href="#id" */
export function scrollToId(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
