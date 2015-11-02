<html>
  <head>
    <style>
      .flex {
        display: flex;
        flex-direction: column;
        height:100%;
      }
      @media (max-width: 500px) {
        .flex {
          height: auto;
        }
        .flex > #record-container {
          flex-direction: column;
        }
        .flex > #record-container > .graph-container {
          order: 2;
          max-height: calc(100vh - 150px);
          overflow-y: scroll;
        }
        .flex > #record-container > .graph {
          order: 3;
        }
        .flex > #record-container > .side {
          order: 1;
          min-height: 600px;
        }
      }
      #record-container {
        display: flex;
        flex-grow: 5;
        flex-direction: column;
        overflow: hidden;
        align-content: stretch;
        flex-wrap: wrap;
      }
      #record-container .graph-container {
        overflow-y: scroll;
        flex-grow: 2;
      }
      #record-container .side {
        flex-grow: 2;
        min-width: 100px;
        min-height: 600px;
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
        <div class="graph-container"><progress id="table_placeholder" max="100" value="0">Loading...</progress></div>
        <div class="side" id="side">
          <span id="bydayhour_placeholder">Loading bydayhour</span>
        </div>
        <div class="graph">
          <canvas id="simplified_graph"></canvas>
        </div>
      </div>
    </div>
    <script>
    document.MAC_SELF = "{{host['host']['mac']}}";
    </script>
    <script src="/static/js/host_analysis.js"></script>
  </body>
</html>
