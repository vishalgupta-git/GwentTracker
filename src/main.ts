import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const target = document.getElementById('app')!
// index.html ships a static copy of the landing text for crawlers; replace it.
target.replaceChildren()

const app = mount(App, { target })

export default app
