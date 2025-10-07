<template>
  <div class="card bg-base-200 shadow-lg">
    <div class="card-body">
      <div class="flex items-center justify-between mb-4">
        <h2 class="card-title">{{ currentMonth }}</h2>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm" @click="previousMonth">‹</button>
          <button class="btn btn-ghost btn-sm" @click="nextMonth">›</button>
          <!-- <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-sm">ⓘ</div>
          </div> -->
        </div>
      </div>

      <!-- Legend -->
      <div class="flex gap-4 text-xs mb-4 opacity-70">
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-success rounded"></div>
          <span>Profit Day</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-error rounded"></div>
          <span>Loss Day</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-primary rounded"></div>
          <span>High Volume</span>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center text-sm mb-2">
        <div class="font-semibold opacity-70">Sun</div>
        <div class="font-semibold opacity-70">Mon</div>
        <div class="font-semibold opacity-70">Tue</div>
        <div class="font-semibold opacity-70">Wed</div>
        <div class="font-semibold opacity-70">Thu</div>
        <div class="font-semibold opacity-70">Fri</div>
        <div class="font-semibold opacity-70">Sat</div>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <!-- Empty cells for days before month starts -->
        <template v-for="empty in emptyDays" :key="`empty-${empty}`">
          <div></div>
        </template>

        <!-- Days of the month -->
        <template v-for="day in daysInMonth" :key="day.date">
          <div
            class="btn btn-ghost btn-sm h-auto py-2 flex flex-col items-center justify-center relative"
            :class="getDayClasses(day)"
            @click="selectDay(day)"
          >
            <span>{{ day.day }}</span>
            <template v-if="day.tradeCount > 0">
              <div class="text-xs opacity-70">{{ day.tradeCount }}</div>
              <div class="text-xs font-semibold" :class="day.pnl >= 0 ? 'text-success' : 'text-error'">
                ${{ formatCurrency(day.pnl) }}
              </div>
            </template>
          </div>
        </template>
      </div>

      <!-- Selected day details -->
      <div v-if="selectedDay" class="mt-4 p-3 bg-base-100 rounded-lg">
        <div class="text-sm font-semibold mb-2">
          {{ formatDate(selectedDay.date) }} - {{ selectedDay.tradeCount }} Trades
        </div>
        <div class="text-xs opacity-70">
          Total P&L: <span :class="selectedDay.pnl >= 0 ? 'text-success' : 'text-error'">
            ${{ formatCurrency(selectedDay.pnl) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDashboard } from '../composables/useDashboard'

const { report } = useDashboard()

interface CalendarDay {
  date: Date
  day: number
  tradeCount: number
  pnl: number
  isCurrentMonth: boolean
}

const currentDate = ref(new Date())
const selectedDay = ref<CalendarDay | null>(null)

// Computed properties
const currentMonth = computed(() => {
  return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const emptyDays = computed(() => {
  const firstDay = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1)
  return firstDay.getDay()
})

const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const lastDay = new Date(year, month + 1, 0)
  const days: CalendarDay[] = []

  // Get trading data for this month
  const monthTrades = getTradesForMonth()

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    const dayTrades = monthTrades.filter(trade =>
      new Date(trade.t).toDateString() === date.toDateString()
    )

    days.push({
      date,
      day,
      tradeCount: dayTrades.length,
      pnl: dayTrades.reduce((sum, trade) => sum + trade.notional, 0),
      isCurrentMonth: true
    })
  }

  return days
})

// Methods
function getTradesForMonth() {
  if (!report.value?.markets.SUMMARY) return []

  return report.value.markets.SUMMARY.trades.filter(trade => {
    const tradeDate = new Date(trade.t)
    return tradeDate.getMonth() === currentDate.value.getMonth() &&
           tradeDate.getFullYear() === currentDate.value.getFullYear()
  })
}

function getDayClasses(day: CalendarDay) {
  const classes = []

  if (day.tradeCount > 0) {
    if (day.pnl > 0) {
      classes.push('bg-success text-success-content')
    } else {
      classes.push('bg-error text-error-content')
    }

    // High volume indicator
    if (day.tradeCount >= 5) {
      classes.push('ring-2 ring-primary')
    }
  }

  return classes
}

function selectDay(day: CalendarDay) {
  selectedDay.value = day
}

function previousMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  selectedDay.value = null
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  selectedDay.value = null
}

function formatCurrency(value: number): string {
  return Math.abs(value).toFixed(0)
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
