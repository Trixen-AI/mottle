import { Activity } from '@/components/sections/Activity'
import { Answers } from '@/components/sections/Answers'
import { Footer } from '@/components/sections/Footer'
import { Header } from '@/components/sections/Header'
import { Hero } from '@/components/sections/Hero'
import { Intro } from '@/components/sections/Intro'
import { Loader } from '@/components/sections/Loader'
import { Screens } from '@/components/sections/Screens'
import { Steps } from '@/components/sections/Steps'
import { Tools } from '@/components/sections/Tools'

export default function HomePage() {
  return (
    <>
      <Loader />
      <Header />
      <main>
        <Hero />
        <Intro />
        <Tools />
        <Answers />
        <Screens />
        <Activity />
        <Steps />
      </main>
      <Footer />
    </>
  )
}
