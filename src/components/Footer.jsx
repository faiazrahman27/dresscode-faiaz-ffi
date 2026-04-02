import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-[rgba(94,207,207,0.08)] bg-[rgba(9,23,23,0.6)]">
      <div className="container py-14">
        <div className="grid-3">
          <div>
            <div className="display mb-3 text-2xl font-bold">Dresscode</div>
            <p className="max-w-md text-sm leading-7 text-white/62">
              A wearable media infrastructure platform where every garment, object,
              or collectible can unlock a dynamic digital experience.
            </p>
          </div>

          <div>
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/55">
              Platform
            </div>
            <div className="flex flex-col gap-3 text-sm text-white/72">
              <Link to="/how-it-works">How it Works</Link>
              <Link to="/use-cases">Use Cases</Link>
              <Link to="/solutions">Solutions</Link>
              <Link to="/journal">Journal</Link>
            </div>
          </div>

          <div>
            <div className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-white/55">
              Company
            </div>
            <div className="flex flex-col gap-3 text-sm text-white/72">
              <Link to="/about">About</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/portal">Portal</Link>
            </div>
          </div>
        </div>

        <div className="divider my-10" />

        <div className="flex flex-col gap-3 text-sm text-white/48 md:flex-row md:items-center md:justify-between">
          <span>© Dresscode 2025. All rights reserved.</span>
          <span>Wearable media · profiles · activation · live content</span>
        </div>
      </div>
    </footer>
  )
}
