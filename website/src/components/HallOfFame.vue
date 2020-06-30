<template>
  <v-container fluid>
    <v-row class="d-flex flex-column">
      <v-col
        v-for="n in 3"
        :key="n"
      >
        <v-card>Hey {{ n }}</v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  export default {
    name: 'HallOfFame',
  };
</script>
