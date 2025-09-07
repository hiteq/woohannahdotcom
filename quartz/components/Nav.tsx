import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

interface NavItem {
  label: string
  href: string
}

const navItems: NavItem[] = [
  { label: "Works", href: "/Works/" },
  { label: "Exhibitions", href: "/Exhibitions/" },
  { label: "Thoughts", href: "/Thoughts/" },
  { label: "Press", href: "/Press/" },
  { label: "About", href: "/About" },
]

export default (() => {
  const Nav: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    return (
      <nav class={classNames(displayClass, "site-nav")}> 
        <ul>
          {navItems.map((item) => (
            <li>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    )
  }

  Nav.css = `
    .site-nav {
      width: 100%;
    }
    .site-nav ul {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .site-nav a {
      text-decoration: none;
    }
  `

  return Nav
}) satisfies QuartzComponentConstructor


