<html>
  <head>
    <style>
      .flex {
        display: flex;
        flex-direction: column;
        max-height:100%;
      }
      #record-container {
        overflow-y: scroll;
      }
      .graph {
        min-height:150px;
      }
      [piece-index] {
        cursor: pointer;
      }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
  </head>
  <body>
    <div class="flex">
      <div>
        <h1>
          <small>Summary for </small>
          {{host['host']['name'] if not host['host']['name'] in ['*', ''] else host['host']['mac']}}</h1>
      </div>
      <div id="summary" class="info">
        <p>Record Count: {{host['record_count']}}</p>
        <p>Sections: {{host['sections']}}</p>
      </div>
      <div id="record-container">
        <progress id="table_placeholder" max="100" value="0">Loading...</progress>
      </div>
      <div class="graph">
        <canvas id="simplified_graph"></canvas>
      </div>
    </div>
    <script>
    document.MAC_SELF = "{{host['host']['mac']}}";
    </script>
    <script src="/static/js/host_analysis.js"></script>
  </body>
</html>
