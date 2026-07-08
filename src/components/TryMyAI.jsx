import { motion } from 'framer-motion'
import { tryMyAI } from '../config/content'
import SectionHeading from './SectionHeading'
import WorkflowDemo from './WorkflowDemo'
import { viewportOnce } from '../lib/anim'

/**
 * "Try My AI" — recruiters simulate an upload (email / PDF / JP doc /
 * video) and watch the pipeline process it. Content in config/content.js.
 */
export default function TryMyAI() {
  return (
    <section id="try" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          kicker={tryMyAI.kicker}
          kickerJa={tryMyAI.kickerJa}
          title={tryMyAI.title}
          lead={tryMyAI.lead}
        />
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <WorkflowDemo />
        </motion.div>
      </div>
    </section>
  )
}
