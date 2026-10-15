import type { MDXComponents } from 'mdx/types'
import { Step } from './components/Step'
import { KeyPoint } from './components/KeyPoint'
import { Detail } from './components/Detail'
import { Pitfall } from './components/Pitfall'
import { Answer, Quiz } from './components/Quiz'
import { Derivation } from './components/Derivation'
import { Figure } from './components/Figure'
import { Back, Card, Flashcards, Front } from './components/Flashcards'
import { Roadmap } from './components/Roadmap'
import { Anchor, Ref } from './jump'
import { Aside } from './components/Aside'

export const mdxComponents: MDXComponents = {
  Step, KeyPoint, Detail, Pitfall, Quiz, Answer, Derivation, Figure, Flashcards, Card, Front, Back, Roadmap, Anchor, Ref, Aside,
  a: (props) => <a {...props} target={props.href?.startsWith('http') ? '_blank' : undefined} rel="noreferrer" />,
  table: (props) => <div className="kb-table-wrap"><table {...props} /></div>,
}
