<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: 'auth'
})

// Use computed for reactive translations
const { t } = useI18n()

const stats = computed(() => [
    { title: t('stat_total_users'), value: '31K', desc: 'Jan 1st - Feb 1st', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { title: t('stat_new_registers'), value: '4,200', desc: '↗︎ 400 (22%)', class: 'text-secondary', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { title: t('stat_new_registers'), value: '1,200', desc: '↘︎ 90 (14%)', class: 'text-secondary', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2 2v6' }
])

// Chart data for AreaChart
const areaChartData = [
  { date: '2024-01-01', desktop: 12000, mobile: 8000 },
  { date: '2024-02-01', desktop: 19000, mobile: 12000 },
  { date: '2024-03-01', desktop: 15000, mobile: 10000 },
  { date: '2024-04-01', desktop: 25000, mobile: 18000 },
  { date: '2024-05-01', desktop: 22000, mobile: 15000 },
  { date: '2024-06-01', desktop: 30000, mobile: 20000 },
]

const areaCategories = computed(() => ({
  desktop: {
    name: 'Desktop',
    color: '#3b82f6',
  },
  mobile: {
    name: 'Mobile',
    color: '#22c55e',
  },
}))

const xFormatter = (tick: number): string => {
  return areaChartData[tick]?.date || ''
}

// Chart data for BarChart
const barChartData = [
  { month: 'january', desktop: 186, mobile: 80 },
  { month: 'february', desktop: 305, mobile: 200 },
  { month: 'march', desktop: 237, mobile: 120 },
  { month: 'april', desktop: 73, mobile: 190 },
  { month: 'may', desktop: 209, mobile: 130 },
  { month: 'june', desktop: 214, mobile: 140 }
]

const barCategories = {
  desktop: { name: 'Desktop', color: '#3b82f6' },
  mobile: { name: 'Mobile', color: '#22c55e' }
}

const barOptions = {
  data: barChartData,
  categories: barCategories,
  valueLabel: {
    label: (d: any) => d.y.toString(),
    labelSpacing: 16,
    labelFontSize: 10,
    color: 'var(--ui-text)'
  },
  xNumTicks: 6,
  xAxis: 'month' as const,
  groupPadding: 0,
  barPadding: 0.2,
  xFormatter: (tick: number, i?: number) =>
    barChartData[typeof i !== 'undefined' ? i : tick]?.month || '',
  yFormatter: (tick: number, i?: number) =>
    `${typeof i !== 'undefined' ? tick : tick}`
}

// Chart data for DonutChart
const donutData = [35, 25, 20, 15, 5]

const donutCategories = {
  'Product A': { name: 'Product A', color: '#3b82f6' },
  'Product B': { name: 'Product B', color: '#22c55e' },
  'Product C': { name: 'Product C', color: '#f59e0b' },
  'Product D': { name: 'Product D', color: '#a855f7' },
  'Other': { name: 'Other', color: '#06b6d4' },
}

// Chart data for BubbleChart
const bubbleChartData = [
  { id: 'Tech-Jan', title: 'Technology', month: 1, viewingHours: 2.9, subscribers: 48 },
  { id: 'Tech-Feb', title: 'Technology', month: 2, viewingHours: 3.1, subscribers: 52 },
  { id: 'Tech-Mar', title: 'Technology', month: 3, viewingHours: 2.5, subscribers: 45 },
  { id: 'Tech-Apr', title: 'Technology', month: 4, viewingHours: 3.8, subscribers: 65 },
  { id: 'Tech-May', title: 'Technology', month: 5, viewingHours: 4.2, subscribers: 72 },
  { id: 'Tech-Jun', title: 'Technology', month: 6, viewingHours: 3.9, subscribers: 68 },
  { id: 'Entertainment-Jan', title: 'Entertainment', month: 1, viewingHours: 1.6, subscribers: 27 },
  { id: 'Entertainment-Feb', title: 'Entertainment', month: 2, viewingHours: 2.3, subscribers: 39 },
  { id: 'Entertainment-Mar', title: 'Entertainment', month: 3, viewingHours: 2.8, subscribers: 44 },
  { id: 'Entertainment-Apr', title: 'Entertainment', month: 4, viewingHours: 3.2, subscribers: 51 },
  { id: 'Entertainment-May', title: 'Entertainment', month: 5, viewingHours: 2.9, subscribers: 46 },
  { id: 'Entertainment-Jun', title: 'Entertainment', month: 6, viewingHours: 3.5, subscribers: 58 },
]

const bubbleCategories = {
  Technology: { name: 'Technology', color: 'var(--color-blue-400)' },
  Entertainment: { name: 'Entertainment', color: 'var(--color-green-400)' },
}

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const xAccessor = (d: any) => d.month
const yAccessor = (d: any) => d.viewingHours
const sizeAccessor = (d: any) => d.subscribers

// Status data for StatusTracker
const statusData = computed(() => {
  const statusHistory = Array.from({ length: 300 }, () => ({
    status: 'online',
  }))
  statusHistory[250]!.status = 'offline'
  return statusHistory
})

// Department spending data for DonutChart
const departmentSpendingData = ref([40, 25, 20, 15, 5])

const departmentLabels = [
  { name: 'Marketing', color: 'var(--color-primary-400)' },
  { name: 'Sales', color: 'var(--color-indigo-400)' },
  { name: 'Development', color: 'var(--color-sky-400)' },
  { name: 'Support', color: 'var(--color-orange-400)' },
  { name: 'Operations', color: 'var(--color-lime-400)' },
]

const departmentCategories = Object.fromEntries(
  departmentLabels.map((i) => [i.name, { name: i.name, color: i.color }]),
)
</script>

<template>
  <!-- stats -->
  <section class="stats stats-vertical col-span-12 w-full xl:stats-horizontal bg-base-100 rounded-box">
    <div v-for="(stat, index) in stats" :key="index" class="stat">
      <div class="stat-title">{{ stat.title }}</div>
      <div class="stat-value">{{ stat.value }}</div>
      <div class="stat-desc">{{ stat.desc }}</div>
    </div>
  </section>
  <!-- /stats -->

  <!-- Progress Circles Row -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-6 col-span-12 mt-8">
      <div class="card bg-base-100 rounded-box">
          <div class="card-body flex flex-col items-center justify-center text-center min-h-[140px]">
              <h3 class="card-title text-sm mb-2">{{ $t('server_status') }}</h3>
              <div class="radial-progress text-primary mx-auto" style="--value:85;" role="progressbar">85%</div>
              <p class="text-xs opacity-70 mt-2">{{ $t('uptime') }}</p>
          </div>
      </div>

      <div class="card bg-base-100 rounded-box">
          <div class="card-body flex flex-col items-center justify-center text-center min-h-[140px]">
              <h3 class="card-title text-sm mb-2">{{ $t('cpu_usage') }}</h3>
              <div class="radial-progress text-secondary mx-auto" style="--value:65;" role="progressbar">65%</div>
              <p class="text-xs opacity-70 mt-2">{{ $t('current_load') }}</p>
          </div>
      </div>

      <div class="card bg-base-100 rounded-box">
          <div class="card-body flex flex-col items-center justify-center text-center min-h-[140px]">
              <h3 class="card-title text-sm mb-2">{{ $t('memory_usage') }}</h3>
              <div class="radial-progress text-accent mx-auto" style="--value:45;" role="progressbar">45%</div>
              <p class="text-xs opacity-70 mt-2">{{ $t('available') }}</p>
          </div>
      </div>

      <div class="card bg-base-100 rounded-box">
          <div class="card-body flex flex-col items-center justify-center text-center min-h-[140px]">
              <h3 class="card-title text-sm mb-2">{{ $t('disk_usage') }}</h3>
              <div class="radial-progress text-info mx-auto" style="--value:72;" role="progressbar">72%</div>
              <p class="text-xs opacity-70 mt-2">{{ $t('used_space') }}</p>
          </div>
      </div>
  </div>

  <!-- Charts / Content -->
  <!-- Row 1: Three charts in 3-column grid -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 col-span-12 mt-8">
      <div class="card bg-base-100 rounded-box">
          <div class="card-body">
              <h2 class="card-title">{{ $t('revenue') }}</h2>
              <AreaChart
                :data="areaChartData"
                :height="300"
                :categories="areaCategories"
                :y-grid-line="true"
                :x-formatter="xFormatter"
                :curve-type="CurveType.MonotoneX"
                :legend-position="LegendPosition.BottomCenter"
                :hide-legend="false"
              />
          </div>
      </div>

      <div class="card bg-base-100 rounded-box">
          <div class="card-body">
              <h2 class="card-title">{{ $t('user_activity') }}</h2>
              <BarChart
                :height="300"
                :y-axis="['desktop', 'mobile']"
                v-bind="barOptions"
              />
          </div>
      </div>

      <div class="card bg-base-100 rounded-box">
          <div class="card-body">
              <h2 class="card-title">{{ $t('category_distribution') }}</h2>
              <DonutChart
                :data="donutData"
                :height="260"
                :categories="donutCategories"
                :radius="80"
                :pad-angle="0.1"
                :arc-width="20"
              >
                <div class="text-center">
                  <div class="font-semibold">Market Share</div>
                  <div class="text-muted">Product Distribution</div>
                </div>
              </DonutChart>
          </div>
      </div>
  </div>

  <!-- Row 2: Two charts side by side -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 col-span-12 mt-8">
      <div class="card bg-base-100 rounded-box">
          <div class="card-body">
              <h2 class="card-title">{{ $t('monthly_growth') }}</h2>
              <AreaChart
                :data="areaChartData"
                :height="300"
                :categories="areaCategories"
                :y-grid-line="true"
                :x-formatter="xFormatter"
                :curve-type="CurveType.MonotoneX"
                :legend-position="LegendPosition.BottomCenter"
                :hide-legend="false"
              />
          </div>
      </div>

      <div class="card bg-base-100 rounded-box">
          <div class="card-body">
              <h2 class="card-title">{{ $t('bubble_chart') }}</h2>
              <BubbleChart
                :data="bubbleChartData"
                :height="230"
                :categories="bubbleCategories"
                category-key="title"
                :x-accessor="xAccessor"
                :y-accessor="yAccessor"
                :y-domain-line="false"
                :size-accessor="sizeAccessor"
                :legend-position="LegendPosition.BottomRight"
                :x-num-ticks="12"
                :x-formatter="(tick: number) => monthNames[tick - 1] ?? String(tick)"
                :y-formatter="(v: number | Date) => `${typeof v === 'number' ? v.toFixed(1) : v}B hrs`"
              />
          </div>
      </div>
  </div>

  <!-- Project Status -->
  <div class="grid grid-cols-1 gap-8 col-span-12 mt-8">
      <div class="card bg-base-100 rounded-box">
          <div class="card-body">
              <h2 class="card-title">{{ $t('project_status') }}</h2>
              <div class="space-y-4">
                  <div class="flex items-center gap-4">
                      <div class="badge badge-success gap-2">
                          <svg data-src="https://unpkg.com/heroicons/20/solid/check-circle.svg" class="h-4 w-4"></svg>
                          Design
                      </div>
                      <div class="flex-1 bg-base-200 rounded-full h-2">
                          <div class="bg-success h-2 rounded-full" style="width: 100%"></div>
                      </div>
                      <span class="text-sm font-medium">100%</span>
                  </div>

                  <div class="flex items-center gap-4">
                      <div class="badge badge-warning gap-2">
                          <svg data-src="https://unpkg.com/heroicons/20/solid/clock.svg" class="h-4 w-4"></svg>
                          Development
                      </div>
                      <div class="flex-1 bg-base-200 rounded-full h-2">
                          <div class="bg-warning h-2 rounded-full" style="width: 75%"></div>
                      </div>
                      <span class="text-sm font-medium">75%</span>
                  </div>

                  <div class="flex items-center gap-4">
                      <div class="badge badge-info gap-2">
                          <svg data-src="https://unpkg.com/heroicons/20/solid/play.svg" class="h-4 w-4"></svg>
                          Testing
                      </div>
                      <div class="flex-1 bg-base-200 rounded-full h-2">
                          <div class="bg-info h-2 rounded-full" style="width: 50%"></div>
                      </div>
                      <span class="text-sm font-medium">50%</span>
                  </div>

                  <div class="flex items-center gap-4">
                      <div class="badge badge-neutral gap-2">
                          <svg data-src="https://unpkg.com/heroicons/20/solid/pause.svg" class="h-4 w-4"></svg>
                          Deployment
                      </div>
                      <div class="flex-1 bg-base-200 rounded-full h-2">
                          <div class="bg-neutral h-2 rounded-full" style="width: 0%"></div>
                      </div>
                      <span class="text-sm font-medium">0%</span>
                  </div>
              </div>
          </div>
      </div>
  </div>
</template>
