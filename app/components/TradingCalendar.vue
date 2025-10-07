<template>
  <div class="card bg-base-200 shadow-lg">
    <div class="card-body">
      <div class="flex items-center justify-between mb-4">
        <h2 class="card-title">December 2023</h2>
        <div class="flex gap-2">
          <button class="btn btn-ghost btn-sm">‹</button>
          <button class="btn btn-ghost btn-sm">›</button>
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-sm">ⓘ</div>
          </div>
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
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div class="btn btn-ghost btn-sm">01</div>
        <div class="btn btn-ghost btn-sm">02</div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div class="btn btn-ghost btn-sm">03</div>
        <div class="btn btn-ghost btn-sm">04</div>
        <div class="btn btn-ghost btn-sm">05</div>
        <div class="btn btn-ghost btn-sm bg-success text-success-content">06</div>
        <div class="btn btn-ghost btn-sm">07</div>
        <div class="btn btn-ghost btn-sm">08</div>
        <div class="btn btn-ghost btn-sm">09</div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div class="btn btn-ghost btn-sm">10</div>
        <div class="btn btn-ghost btn-sm bg-success text-success-content">
          <div>11</div>
          <div class="text-xs">28</div>
          <div class="text-xs">$62.9K</div>
        </div>
        <div class="btn btn-ghost btn-sm">12</div>
        <div class="btn btn-ghost btn-sm">13</div>
        <div class="btn btn-ghost btn-sm">14</div>
        <div class="btn btn-ghost btn-sm">15</div>
        <div class="btn btn-ghost btn-sm">16</div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div class="btn btn-ghost btn-sm">17</div>
        <div class="btn btn-ghost btn-sm">18</div>
        <div class="btn btn-ghost btn-sm">19</div>
        <div class="btn btn-ghost btn-sm">20</div>
        <div class="btn btn-ghost btn-sm">21</div>
        <div class="btn btn-ghost btn-sm">22</div>
        <div class="btn btn-ghost btn-sm">23</div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div class="btn btn-ghost btn-sm">24</div>
        <div class="btn btn-ghost btn-sm">25</div>
        <div class="btn btn-ghost btn-sm">26</div>
        <div class="btn btn-ghost btn-sm">27</div>
        <div class="btn btn-ghost btn-sm">28</div>
        <div class="btn btn-ghost btn-sm">29</div>
        <div class="btn btn-ghost btn-sm">30</div>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div class="btn btn-ghost btn-sm">31</div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed for this static calendar component
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
