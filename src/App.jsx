import { useEffect, useState } from 'react'
import Background from './components/Background'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import VideoSection from './components/VideoSection'
import Impact from './components/Impact'
import Projects from './components/Projects'
import CaseStudy from './components/CaseStudy'
import BeforeAfter from './components/BeforeAfter'
import Proof from './components/Proof'
import TryMyAI from './components/TryMyAI'
import Skills from './components/Skills'
import About from './components/About'
import RecruiterProof from './components/RecruiterProof'
import Roadmap from './components/Roadmap'
import JapanFit from './components/JapanFit'
import Footer from './components/Footer'
import PromptVault from './components/PromptVault'

/**
 * Tiny hash router — no extra libraries needed and it works on
 * GitHub Pages. Two views:
 *   (default)   the one-page portfolio
 *   #/vault     the Prompt Vault library page
 * Any other hash (#projects, #contact, …) is a normal section anchor
 * inside the portfolio.
 */
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash.startsWith('#/vault') ? 'vault' : 'portfolio'
}

export default function App() {
  const route = useHashRoute()

  // start each view at the top when switching between them
  useEffect(() => {
    if (route === 'vault') window.scrollTo(0, 0)
  }, [route])

  return (
    <>
      <Background />
      {route === 'vault' ? (
        <PromptVault />
      ) : (
        <>
          <Navbar />
          <main>
            <Hero />
            <VideoSection />
            <Impact />
            <Projects />
            <CaseStudy />
            <TryMyAI />
            <BeforeAfter />
            <Proof />
            <Skills />
            <About />
            <Roadmap />
            <JapanFit />
            <RecruiterProof />
          </main>
          <Footer />
        </>
      )}
    </>
  )
}
