import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { navigate } from "../router";

/** An internal link. Plain left clicks switch pages without a reload; Ctrl/Cmd-click, middle-click and
 *  "open in new tab" still work because it is a real <a href>. */
export default function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(href);
  }
  return <a href={href} onClick={handle} {...rest} />;
}
