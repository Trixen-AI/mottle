// react-slick ships CommonJS; in Vite dev the default import can arrive wrapped as { default }.
import SlickModule from 'react-slick'

type SliderType = typeof SlickModule
const mod = SlickModule as SliderType & { default?: SliderType }

export const Slider: SliderType = mod.default ?? mod
export type Slider = InstanceType<SliderType>
