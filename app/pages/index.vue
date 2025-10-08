<!-- ZillionsLanding.vue -->
<template>
  <div class="min-h-screen flex flex-col bg-base-100 text-white selection:bg-primary/10 overflow-x-hidden">
    <!-- Subtle gradient backdrop -->
    <div class="pointer-events-none fixed inset-0 -z-10">
      <div
        class="absolute -top-40 -left-40 h-[48rem] w-[48rem] rounded-full blur-3xl opacity-25"
        :style="{ background: 'radial-gradient(50% 50% at 50% 50%, var(--p) 0%, transparent 65%)' }"
      />
      <div
        class="absolute -bottom-40 -right-40 h-[48rem] w-[48rem] rounded-full blur-3xl opacity-10"
        :style="{ background: 'radial-gradient(50% 50% at 50% 50%, var(--a) 0%, transparent 70%)' }"
      />
    </div>

    <!-- Navbar -->
    <header class="navbar max-w-7xl mx-auto w-full px-4 lg:px-6 py-6 backdrop-blur-sm bg-base-100/80 sticky top-0 z-50">
      <div class="navbar-start gap-3">
        <img :src="logoToUse" alt="Zillions" class="h-8 w-auto rounded-full" />
        <a class="font-semibold tracking-tight text-lg">Zillions<span class="text-primary"> </span></a>
      </div>
      <div class="navbar-center hidden md:flex">
        <ul class="menu menu-horizontal px-1">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#tech">Technology</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
      </div>
      <div class="navbar-end">
        <a href="#waitlist" class="btn btn-primary btn-sm rounded-xl">Join the waitlist</a>
      </div>
    </header>

    <!-- Hero -->
    <section class="w-full">
      <div class="max-w-7xl mx-auto px-4 lg:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center py-10 lg:py-20">
        <div>
          <div class="badge badge-outline badge-lg border-base-300 text-xs md:text-sm mb-6 animate-fade-in">On‑chain • Non‑custodial • AI‑driven</div>
          <h1 class="text-4xl md:text-6xl/tight font-bold tracking-tight animate-slide-up">
            Become a <span class="text-primary">Zillionaire</span>
          </h1>
          <p class="mt-6 text-base md:text-lg text-white/80 leading-relaxed animate-fade-in">
            Zillions is an on‑chain, autonomous “meta‑trading” bot designed to help more people participate in markets - without needing to be a pro. 
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-4 animate-slide-up">
            <a href="#waitlist" class="btn btn-primary btn-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">Join the waitlist</a>
            <a href="#how" class="btn btn-ghost btn-lg hover:underline transition-all duration-300">See how it works</a>
          </div>

        </div>

        <div class="relative">
          <div class="mockup-window border border-base-300 rounded-3xl overflow-hidden shadow-2xl bg-base-200">
            <WalletPreview/>
          </div>
          <div class="absolute -right-6 -bottom-6 hidden md:block">
            <div class="badge badge-outline">Preview</div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="max-w-7xl mx-auto px-4 lg:px-6 my-16">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <div class="stat bg-base-200/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-base-300/50 hover:border-primary/20 transition-all duration-300">
            <div class="stat-title text-xs uppercase tracking-wider opacity-70 text-white/50">No expertise needed</div>
            <div class="stat-value text-lg md:text-2xl mt-1 font-bold bg-white/70 bg-clip-text text-transparent whitespace-nowrap">For everyone</div>
          </div>
          <div class="stat bg-base-200/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-base-300/50 hover:border-primary/20 transition-all duration-300">
            <div class="stat-title text-xs uppercase tracking-wider opacity-70 text-white/50">On‑chain</div>
            <div class="stat-value text-lg md:text-2xl mt-1 font-bold bg-white/70 bg-clip-text text-transparent whitespace-nowrap">Transparent</div>
          </div>
          <div class="stat bg-base-200/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-base-300/50 hover:border-primary/20 transition-all duration-300">
            <div class="stat-title text-xs uppercase tracking-wider opacity-70 text-white/50">Adaptive</div>
            <div class="stat-value text-lg md:text-2xl mt-1 font-bold bg-white/70 bg-clip-text text-transparent whitespace-nowrap">Regime‑aware</div>
          </div>
          <div class="stat bg-base-200/50 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-base-300/50 hover:border-primary/20 transition-all duration-300">
            <div class="stat-title text-xs uppercase tracking-wider opacity-70 text-white/50">Hands‑off</div>
            <div class="stat-value text-lg md:text-2xl mt-1 font-bold bg-white/70 bg-clip-text text-transparent whitespace-nowrap">Auto‑pilot</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Feature grid -->
    <section id="features" class="py-16 lg:py-24 bg-base-200/40">
      <div class="max-w-7xl mx-auto px-4 lg:px-6">
        <h2 class="text-2xl md:text-3xl font-bold">Why Zillions is different</h2>
        <p class="mt-2 text-white/70">Not another "trading bot" app. Zillions detects market strategies in real-time - and adapts.</p>
        <div class="mt-10 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <article class="card bg-base-200 border border-base-300 hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge badge-primary badge-outline mb-2">Core</div>
              <h3 class="card-title text-xl">Meta‑trading engine</h3>
              <p class="text-sm opacity-80">Aligns with the currently dominant strategy regime instead of running blind or fixed logic.</p>
            </div>
          </article>
          <article class="card bg-base-200 border border-base-300 hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge badge-primary badge-outline mb-2">Security</div>
              <h3 class="card-title text-xl">On‑chain & transparent</h3>
              <p class="text-sm opacity-80">Execution, history, and parameters live on chain for auditability. No black box custody.</p>
            </div>
          </article>
          <article class="card bg-base-200 border border-base-300 hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge badge-primary badge-outline mb-2">UX</div>
              <h3 class="card-title text-xl">Hands‑off simplicity</h3>
              <p class="text-sm opacity-80">No knobs, no charts to study. Fund a vault and let the algorithm adapt 24/7.</p>
            </div>
          </article>
          <article class="card bg-base-200 border border-base-300 hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge badge-primary badge-outline mb-2">Safety</div>
              <h3 class="card-title text-xl">Risk‑aware</h3>
              <p class="text-sm opacity-80">Position sizing & regime‑specific risk controls aim to protect during adverse phases.</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="py-14 lg:py-20">
      <div class="max-w-7xl mx-auto px-4 lg:px-6">
        <h2 class="text-2xl md:text-3xl font-bold">Three steps, zero guesswork</h2>
        <div class="mt-8 grid lg:grid-cols-3 gap-6">
          <div class="card bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge badge-primary badge-lg">1</div>
              <h3 class="card-title mt-3 text-2xl">Connect your wallet</h3>
              <p class="text-sm opacity-80">Non‑custodial by design. You keep control.</p>
            </div>
          </div>
          <div class="card bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge badge-primary badge-lg">2</div>
              <h3 class="card-title mt-3 text-2xl">Fund your vault</h3>
              <p class="text-sm opacity-80">Allocate capital to a Zillions vault. Transparent fees, on‑chain execution.</p>
            </div>
          </div>
          <div class="card bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge badge-primary badge-lg">3</div>
              <h3 class="card-title mt-3 text-2xl">AI adapts in real time</h3>
              <p class="text-sm opacity-80">The engine follows the dominant regime - momentum, mean‑reversion, liquidity hunts and more.</p>
            </div>
          </div>
        </div>
        <div class="mt-10">
          <a href="#waitlist" class="btn btn-primary rounded-xl">Get early access</a>
        </div>
      </div>
    </section>

    <!-- Technology (high level) -->
    <section id="tech" class="py-14 lg:py-20 bg-base-200/40">
      <div class="max-w-7xl mx-auto px-4 lg:px-6">
        <h2 class="text-2xl md:text-3xl font-bold">Inside the engine</h2>
        <p class="mt-2 text-white/70">Our trading system analyzes market trends, signals, and risk to find the best opportunities. It adapts to changing conditions automatically.</p>

        <div class="mt-8 grid md:grid-cols-2 gap-6">
          <ul class="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
            <li>
              <div class="timeline-middle">
                <span class="badge badge-primary badge-lg cursor-pointer transition-all duration-300 hover:scale-110" :class="{ 'badge-accent': selectedStrategy === 'trend' }" @click="selectedStrategy = 'trend'">Trend</span>
              </div>
              <div class="timeline-end timeline-box bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-300 cursor-pointer" :class="{ 'border-primary bg-primary/5': selectedStrategy === 'trend' }" @click="selectedStrategy = 'trend'">
                <div class="font-medium text-lg">Multi-Timeframe Trend Analysis</div>
                <div class="text-sm opacity-80 mt-1">Uses ROC (Rate of Change) and EMA indicators to identify the overall trend direction and strength across different timeframes.</div>
              </div>
              <hr class="bg-primary/20"/>
            </li>
            <li>
              <div class="timeline-middle">
                <span class="badge badge-primary badge-lg cursor-pointer transition-all duration-300 hover:scale-110" :class="{ 'badge-accent': selectedStrategy === 'signals' }" @click="selectedStrategy = 'signals'">Signals</span>
              </div>
              <div class="timeline-end timeline-box bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-300 cursor-pointer" :class="{ 'border-primary bg-primary/5': selectedStrategy === 'signals' }" @click="selectedStrategy = 'signals'">
                <div class="font-medium text-lg">OBOS Signals</div>
                <div class="text-sm opacity-80 mt-1">Detects overbought/oversold conditions using RSI and pivot points to find potential entry opportunities when momentum diverges from price.</div>
              </div>
              <hr class="bg-primary/20"/>
            </li>
            <li>
              <div class="timeline-middle">
                <span class="badge badge-primary badge-lg cursor-pointer transition-all duration-300 hover:scale-110" :class="{ 'badge-accent': selectedStrategy === 'confirm' }" @click="selectedStrategy = 'confirm'">Confirm</span>
              </div>
              <div class="timeline-end timeline-box bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-300 cursor-pointer" :class="{ 'border-primary bg-primary/5': selectedStrategy === 'confirm' }" @click="selectedStrategy = 'confirm'">
                <div class="font-medium text-lg">HTF Confirmation</div>
                <div class="text-sm opacity-80 mt-1">Requires higher timeframe alignment before entering trades, reducing false signals and improving accuracy.</div>
              </div>
              <hr class="bg-primary/20"/>
            </li>
            <li>
              <div class="timeline-middle">
                <span class="badge badge-primary badge-lg cursor-pointer transition-all duration-300 hover:scale-110" :class="{ 'badge-accent': selectedStrategy === 'risk' }" @click="selectedStrategy = 'risk'">Risk</span>
              </div>
              <div class="timeline-end timeline-box bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-300 cursor-pointer" :class="{ 'border-primary bg-primary/5': selectedStrategy === 'risk' }" @click="selectedStrategy = 'risk'">
                <div class="font-medium text-lg">Risk Management</div>
                <div class="text-sm opacity-80 mt-1">Implements trailing stops and take-profit levels to lock in gains while protecting against downside risk.</div>
              </div>
              <hr class="bg-primary/20"/>
            </li>
            <li>
              <div class="timeline-middle">
                <span class="badge badge-primary badge-lg cursor-pointer transition-all duration-300 hover:scale-110" :class="{ 'badge-accent': selectedStrategy === 'size' }" @click="selectedStrategy = 'size'">Size</span>
              </div>
              <div class="timeline-end timeline-box bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-300 cursor-pointer" :class="{ 'border-primary bg-primary/5': selectedStrategy === 'size' }" @click="selectedStrategy = 'size'">
                <div class="font-medium text-lg">Position Sizing</div>
                <div class="text-sm opacity-80 mt-1">Uses percentage-based position sizing to maintain consistent risk exposure across different trade sizes.</div>
              </div>
            </li>
          </ul>

          <div class="card bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="mb-4">
                <h3 class="card-title text-2xl">{{ strategyContent[selectedStrategy].title }}</h3>
              </div>

              <div class="mt-6 space-y-4">
                <div v-for="(benefit, index) in strategyContent[selectedStrategy].benefits" :key="benefit" class="group">
                  <div class="flex items-start gap-4 p-4 bg-base-100/30 rounded-xl border border-base-300/30 hover:border-primary/30 hover:bg-base-100/50 transition-all duration-300 hover:translate-x-2">
                    <div class="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                      <div class="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-white/90 leading-relaxed">{{ benefit }}</p>
                    </div>
                  </div>
                </div>
              </div>



              <!-- Strategy-specific alerts -->
              <div v-if="selectedStrategy !== 'overview'" class="alert alert-info text-white bg-base-200/50 backdrop-blur-sm mt-6 border border-info/20">
                <span>{{ strategyContent[selectedStrategy].description }}</span>
              </div>

              <div v-if="selectedStrategy === 'overview'" class="alert alert-info text-white bg-base-200/50 backdrop-blur-sm mt-6 border border-info/20">
                <span>{{ strategyContent[selectedStrategy].description }}</span>
              </div>


            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Comparison -->
    <section class="py-14 lg:py-20">
      <div class="max-w-7xl mx-auto px-4 lg:px-6">
        <h2 class="text-2xl md:text-3xl font-bold">Built for the many - not just pros</h2>
        <div class="mt-6 grid md:grid-cols-2 gap-6">
          <div class="card bg-base-200 border border-base-300 hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge badge-outline mb-2">Legacy</div>
              <h3 class="card-title text-xl">Typical trading app</h3>
              <ul class="list-disc ms-5 text-sm opacity-80 space-y-3 mt-4">
                <li class="hover:translate-x-1 transition-transform duration-300">Expect you to pick & tune strategies.</li>
                <li class="hover:translate-x-1 transition-transform duration-300">Opaque logic, off‑chain execution.</li>
                <li class="hover:translate-x-1 transition-transform duration-300">Hard to onboard; easy to make mistakes.</li>
                <li class="hover:translate-x-1 transition-transform duration-300">Manual Trading is tough - you can't ourperform masters & algos.</li>
              </ul>
            </div>
          </div>
          <div class="card bg-base-200 border-2 border-primary hover:shadow-lg transition-all duration-300">
            <div class="card-body">
              <div class="badge badge-primary mb-2">Modern</div>
              <h3 class="card-title text-xl">Zillions</h3>
              <ul class="list-disc ms-5 text-sm opacity-90 space-y-3 mt-4">
                <li class="hover:translate-x-1 transition-transform duration-300">Meta‑trading engine aligns with the dominant regime.</li>
                <li class="hover:translate-x-1 transition-transform duration-300">On‑chain, transparent vaults; simple by default.</li>
                <li class="hover:translate-x-1 transition-transform duration-300">Designed for everyone. No need to be a pro.</li>
                <li class="hover:translate-x-1 transition-transform duration-300">AI & Scoring algo detects which stratagies works the best.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Waitlist -->
    <section id="waitlist" class="py-24 lg:py-32 bg-base-200/40 relative overflow-hidden">
      <div class="max-w-3xl mx-auto px-4 lg:px-6 relative z-10">
        <div class="card  transition-all duration-500 rounded-3xl">
          <div class="card-body text-center">
            <!-- Heading -->
            <h2 class="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Be one of the first to trade smarter
            </h2>
            <p class="mt-3 text-base md:text-lg opacity-80">
              Join the Zillions waitlist and unlock early access to the on-chain meta-trader.  
              Simple, adaptive, transparent.
            </p>

            <!-- Waitlist form -->
            <form @submit.prevent="submitWaitlist" class="mt-8 flex flex-col justify-center">
              <input
                v-model="email"
                type="email"
                required
                placeholder="you@domain.com"
                class="input input-lg w-full rounded-2xl bg-base-100/70 backdrop-blur-sm border border-base-300/60 focus:border-primary focus:ring-2 focus:ring-primary/30 text-lg"
              />
              <button
                class="btn btn-primary btn-lg rounded-2xl shadow-lg hover:shadow-primary/40 transition-all duration-300 flex items-center gap-2 justify-center"
                :class="{ 'btn-disabled loading': isSubmitting }"
                :disabled="isSubmitting"
              >
                <span v-if="!isSubmitting">Join the waitlist</span>
                <span v-else>Joining…</span>
              </button>
            </form>

            <!-- Consent -->
            <label class="label cursor-pointer justify-center gap-2 mt-3">
              <input type="checkbox" class="checkbox checkbox-sm" v-model="consent" />
              <span class="label-text text-xs opacity-70">
                I agree to receive emails about Zillions and understand this is not financial advice.
              </span>
            </label>

            <!-- Toast -->
            <div v-if="toast.message" class="toast toast-end">
              <div :class="['alert', toast.type === 'success' ? 'alert-success' : 'alert-error']">
                <span>{{ toast.message }}</span>
              </div>
            </div>

            <!-- Fine print -->
            <div class="text-xs opacity-60 mt-4">
              By joining you agree to our <button @click="showTermsModal = true" class="link">Terms</button> & <button @click="showPrivacyModal = true" class="link">Privacy</button>. Unsubscribe anytime.
            </div>
          </div>
        </div>
      </div>

      <!-- Modals -->
      <PrivacyModal v-model="showPrivacyModal" />
      <TermsModal v-model="showTermsModal" />
    </section>


    <!-- FAQ -->
    <section id="faq" class="py-20 lg:py-28">
      <div class="max-w-4xl mx-auto px-4 lg:px-6">
        <h2 class="text-2xl md:text-3xl font-bold text-center">FAQ</h2>
        <p class="mt-3 text-white/70 text-center">Common questions about Zillions</p>
        <div class="mt-10 join join-vertical w-full">
          <div class="collapse collapse-arrow join-item border border-base-300 hover:bg-base-200/50 transition-all duration-300">
            <input type="checkbox" />
            <div class="collapse-title text-md font-medium">Do I need trading experience?</div>
            <div class="collapse-content text-sm opacity-80">
              No. Zillions is built so anyone can participate. The engine adapts to markets for you.
            </div>
          </div>
          <div class="collapse collapse-arrow join-item border border-base-300">
            <input type="checkbox" />
            <div class="collapse-title text-md font-medium">Is this custodial?</div>
            <div class="collapse-content text-sm opacity-80">
              No - it’s on‑chain and non‑custodial. You can track execution and history transparently.
            </div>
          </div>
          <div class="collapse collapse-arrow join-item border border-base-300">
            <input type="checkbox" />
            <div class="collapse-title text-md font-medium">Are returns guaranteed?</div>
            <div class="collapse-content text-sm opacity-80">
              No. Markets involve risk. The system aims to grow capital by aligning to dominant regimes, but losses are possible.
            </div>
          </div>
          <div class="collapse collapse-arrow join-item border border-base-300">
            <input type="checkbox" />
            <div class="collapse-title text-md font-medium">What chains and assets will you support?</div>
            <div class="collapse-content text-sm opacity-80">
              We’ll announce supported chains and assets to waitlisters first.
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="mt-auto border-t border-base-300 bg-base-200/30">
      <div class="max-w-7xl mx-auto px-4 lg:px-6 py-10 grid md:grid-cols-2 gap-6">
        <div>
          <div class="flex items-center gap-3">
            <img :src="logoToUse" alt="Zillions" class="h-6 w-auto rounded-full" />
            <span class="font-semibold">Zillions</span>
          </div>
          <p class="text-xs opacity-70 mt-3">
            Zillions is an on‑chain, autonomous “meta‑trading” app designed to help more people participate in markets - without needing to be a pro.
          </p>
          <p class="text-xs opacity-60 mt-2">© {{ new Date().getFullYear() }} Zillions. All rights reserved.</p>
        </div>
        <div class="text-xs opacity-70">
          <div class="font-semibold mb-2">Disclosures</div>
          <p>
            Trading involves risk, including possible loss of capital.
            Past performance does not guarantee future results. Availability subject to jurisdiction and compliance screening.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import PrivacyModal from '../components/PrivacyModal.vue'
import TermsModal from '../components/TermsModal.vue'

/**
 * Props
 * - logoSrc: optional override for the brand logo (e.g., import or URL).
 *   Defaults to an embedded data URI placeholder; replace with your real asset as desired.
 */

const props = defineProps<{ logoSrc?: string }>()
const EMBEDDED_LOGO = '/logo.jpg'
const logoToUse = computed(() => props.logoSrc || EMBEDDED_LOGO)

import Airtable from 'airtable'

// Airtable configuration
const base = new Airtable({
  apiKey: 'patCFagdCGHtw28la.78dcfa09f9d8230ac06476485eaa93b29af7a559eb93deb710d23161a8d33eb8'
}).base('appRswXSpvnpfTSL8')

const email = ref('')
const consent = ref(true)
const isSubmitting = ref(false)
const toast = ref<{ type: 'success' | 'error'; message: string } | { message: ''; type?: any }>({ message: '' })
const showPrivacyModal = ref(false)
const showTermsModal = ref(false)

// Strategy selection state
const selectedStrategy = ref<'overview' | 'trend' | 'signals' | 'confirm' | 'risk' | 'size'>('trend')

// Strategy content data
const strategyContent = reactive({
  overview: {
    title: 'What you get',
    benefits: [
      'Multi-timeframe analysis for trend confirmation.',
      'Overbought/oversold detection for entry timing.',
      'Higher timeframe confirmation reduces false signals.',
      'Advanced risk management with trailing stops and take-profits.',
      'Consistent position sizing for optimal risk exposure.'
    ],
    description: 'Advanced trading system designed for consistent performance across market conditions.',
    showSimulation: true
  },
  trend: {
    title: 'Multi-Timeframe Trend Analysis',
    benefits: [
      'Analyzes trends across multiple timeframes simultaneously (1m, 5m, 15m, 1h, 4h, 1d)',
      'Uses Rate of Change (ROC) to measure momentum strength and direction',
      'Exponential Moving Averages (EMA) identify primary trend direction',
      'Filters out market noise while preserving significant trend movements',
      'Provides trend strength scoring from 0-100 for position confidence'
    ],
    description: 'Our trend analysis engine examines price movements across multiple timeframes to identify the dominant market direction, filtering out short-term noise while capturing significant trend changes.',
    showSimulation: true
  },
  signals: {
    title: 'OBOS Signal Detection',
    benefits: [
      'RSI divergence detection identifies momentum shifts before price confirms',
      'Pivot point analysis finds key support/resistance levels automatically',
      'Overbought (>70 RSI) and oversold (<30 RSI) condition monitoring',
      'Volume-price divergence analysis for signal confirmation',
      'Multi-indicator convergence increases signal reliability to 78%'
    ],
    description: 'Advanced signal detection combines RSI, pivot points, and volume analysis to identify high-probability entry points when momentum diverges from price direction.',
    showSimulation: true
  },
  confirm: {
    title: 'Higher Timeframe Confirmation',
    benefits: [
      'Requires 4-hour and daily timeframe alignment before execution',
      'Reduces false signal rate by 65% compared to single timeframe',
      'Eliminates trades against the broader market trend',
      'Provides confidence scoring based on timeframe alignment',
      'Prevents entries during uncertain or choppy market conditions'
    ],
    description: 'Higher timeframe confirmation ensures trades align with the broader market structure, dramatically reducing false signals and improving overall accuracy.',
    showSimulation: false
  },
  risk: {
    title: 'Advanced Risk Management',
    benefits: [
      'Dynamic trailing stops adjust based on market volatility (ATR-based)',
      'Take-profit levels set at 2:1 reward-to-risk minimum ratios',
      'Position sizing adjusts based on win rate and volatility',
      'Maximum drawdown protection with circuit breakers',
      'Risk-adjusted position sizing prevents overexposure'
    ],
    description: 'Sophisticated risk management system uses trailing stops, take-profit optimization, and dynamic position sizing to protect capital while maximizing returns.',
    showSimulation: false
  },
  size: {
    title: 'Intelligent Position Sizing',
    benefits: [
      'Percentage-based sizing maintains consistent risk exposure',
      'Volatility-adjusted sizing reduces exposure in turbulent markets',
      'Win rate optimization adjusts size based on recent performance',
      'Portfolio heat management prevents over-concentration',
      'Compounding-friendly sizing supports long-term growth'
    ],
    description: 'Position sizing algorithm ensures optimal capital allocation across different market conditions and strategy performance levels.',
    showSimulation: false
  }
})

async function submitWaitlist() {
  if (!consent.value) {
    toast.value = { type: 'error', message: 'Please agree to receive emails so we can contact you.' }
    return
  }
  if (!email.value || !/^\S+@\S+\.\S+$/.test(email.value)) {
    toast.value = { type: 'error', message: 'Please enter a valid email address.' }
    return
  }

  isSubmitting.value = true
  try {
    await base('waitlist').create([
      {
        fields: {
          'Email': email.value
        }
      }
    ])
    toast.value = { type: 'success', message: 'You’re on the list! We’ll be in touch soon.' }
    email.value = ''
  } catch (e) {
    console.error(e)
    toast.value = { type: 'error', message: 'Something went wrong. Please try again later.' }
  } finally {
    isSubmitting.value = false
    setTimeout(() => (toast.value = { message: '' } as any), 4000)
  }
}
</script>

<style scoped>
/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.8s ease-out forwards;
}

/* Enhanced Typography */
.card-title { 
  letter-spacing: -0.015em;
  font-weight: 600;
}

h1, h2 { 
  letter-spacing: -0.02em;
  line-height: 1.1;
}

/* Component Enhancements */
.btn {
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.card {
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
}

.mockup-window {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  transition: all 0.3s ease;
  background: linear-gradient(180deg, rgba(17,45,57,0.08), rgba(17,45,57,0.03));
}

.mockup-window:hover {
  transform: translateY(-4px);
}

/* Focus States */
a:focus-visible, 
button:focus-visible, 
.btn:focus-visible, 
.input:focus-visible {
  outline: 2px solid var(--p);
  outline-offset: 2px;
}

/* Menu Refinements */
.menu a {
  transition: all 0.3s ease;
  border-radius: 0.75rem;
}

.menu a:hover {
  background: rgba(var(--p), 0.1);
  transform: translateX(4px);
}

/* Timeline Enhancements */
.timeline-box {
  transition: all 0.3s ease;
}

.timeline-box:hover {
  transform: translateX(4px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

/* Input Field Polish */
.input {
  transition: all 0.3s ease;
}

.input:focus {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}
</style>
