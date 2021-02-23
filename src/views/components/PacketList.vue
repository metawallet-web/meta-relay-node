<template>
  <div   class="m-4 p-4 text-white">

               <div class="text-gray-500 text-lg "> {{title}} </div>

               <div class=" " v-if="packetsArray.length == 0" >
                  <div>  No recent meta transactons. </div>

               </div>



            <div class="text-xs  " v-if="packetsArray.length > 0" >
                  

                <table class="table-auto">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>

                      <th>Time</th>
                      <th>Tx Hash</th>
                       
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="packet in packetsArray">
                      <td>{{packet.input.from}}</td>
                      <td>{{packet.input.to}}</td>
                      <td>{{packet.status}}</td>
                      <td>{{packet.birthtime}}</td>

                      <td v-if="packet.txdata">{{packet.txdata.txhash}}</td>
                      <td v-if="!packet.txdata"> --- No Tx Hash --- </td>
                    </tr>
                     
                  </tbody>
                </table>


            </div>




    </div>
</template>

<script>
export default {
    name: 'PacketList',
    props: ['title', 'packetsArray'],
  data() {
    return {

    }
  },
  methods: {

  }
}
</script>