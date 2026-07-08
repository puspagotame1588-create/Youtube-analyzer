import Background from './components/Background'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import VideoSection from './components/VideoSection'
import Projects from './components/Projects'
import CaseStudy from './components/CaseStudy'
import BeforeAfter from './components/BeforeAfter'
import Skills from './components/Skills'
import About from './components/About'
import RecruiterProof from './components/RecruiterProof'
import Roadmap from './components/Roadmap'
import JapanFit from './components/JapanFit'
import Footer from './components/Footer'

/**
 * One-page AI/DX portfolio.
 * Scroll narrative: positioning → proof (video/projects/case study)
 * → transformation → capability → person → plan → Japan fit → contact.
 */
export default function App() {
  return (
    <>
      <Background />
      <Navbar />
      <main>
        <Hero />
        <VideoSection />
        <Projects />
        <CaseStudy />
        <BeforeAfter />
        <Skills />
        <About />
        <Roadmap />
        <JapanFit />
        <RecruiterProof />
      </main>
      <Footer />
    </>
  )
}
