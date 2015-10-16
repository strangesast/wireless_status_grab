<html>
  <head>
    <style>
      [piece-index] {
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <h1>
      <small>Summary for </small>
      {{host['host']['name'] if not host['host']['name'] in ['*', ''] else host['host']['mac']}}</h1>
    <div id="summary" class="info">
      <p>Record Count: {{host['record_count']}}</p>
      <p>Sections: {{host['sections']}}</p>
      <p id="table_placeholder">Loading...</p>
      <canvas id="simplified_graph"></canvas>
    </div>
    <script>
    document.MAC_SELF = "{{host['host']['mac']}}";
    </script>
    <script src="/static/js/host_analysis.js"></script>
  </body>
</html>
