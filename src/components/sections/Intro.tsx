import { useEffect, useState } from 'react'
import { DotCanvas } from '@/components/ui/DotCanvas'
import { INTRO } from '@/data/site'

const NOISE = '█▓▒░=+*#&@ac0123456789bdef'

// Scramble a string in place every tick so the observer view never settles on real data.
function useScramble(source: string, ms = 140) {
  const [s, setS] = useState(source)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      setS((prev) =>
        prev
          .split('')
          .map((ch) => (ch === ' ' ? ' ' : Math.random() < 0.3 ? NOISE[Math.floor(Math.random() * NOISE.length)] : ch))
          .join(''),
      )
    }, ms)
    return () => clearInterval(id)
  }, [ms])
  return s
}

function Scrambled({ text }: { text: string }) {
  return <>{useScramble(text)}</>
}

export function Intro() {
  const o = INTRO.observer
  return (
    <section id="privacy" className="intro screen">
      <div className="split">
        <div className="col-40">
          <div>
            <p className="kicker">{INTRO.kicker}</p>
            <h3>{INTRO.title}</h3>
            <p className="lede">{INTRO.body}</p>
          </div>
        </div>
        <div className="col-60">
          <DotCanvas scene="crowd" label="A crowd of identical dots. A highlighted transfer drifts in and becomes impossible to pick out." />
          <aside className="observer" aria-label="Chain observer view, simulated">
            <div className="observer-head">
              <span>chain observer view</span>
              <span className="live">live</span>
            </div>
            <dl>
              {o.rows.map((r) => (
                <div key={r.k} style={{ display: 'contents' }}>
                  <dt>{r.k}</dt>
                  <dd aria-label="unreadable">
                    <Scrambled text={r.v} />
                  </dd>
                </div>
              ))}
              <dt>links to you</dt>
              <dd className="zero">{o.links}</dd>
            </dl>
            <div className="observer-split">
              <div>
                <span>you send</span>
                <b>{o.youSend}</b>
              </div>
              <div>
                <span>chain sees</span>
                <b className="scr" aria-label="unreadable">
                  <Scrambled text={o.chainSees} />
                </b>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
