<template>
  <div class='home'>
    <hall-of-fame />
  </div>
</template>

<script>
  import HallOfFame from '@/components/HallOfFame.vue';

  export default {
    name: 'Home',
    components: {
      HallOfFame,
    },
  };
</script>
