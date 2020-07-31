<template>
  <div class='home'>
    <hall-of-fame />
  </div>
</template>

<script>
  import HallOfFame from '@/components/HallOfFame';
  import titleMixin from '@/mixins/title';

  export default {
    name: 'Home',
    components: {
      HallOfFame,
    },
    mixins: [
      titleMixin,
    ],
    title: 'Home',
  };
</script>
