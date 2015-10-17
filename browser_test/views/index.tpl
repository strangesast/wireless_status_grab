<html>
  <head>
  <style>
    .recent::after {
      content: "  ⌂";
    }
    tr:nth-child(odd) {
      background: lightgrey;
    }
    tr > td[
  </style>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  </head>
  <body>
    <h1>Client List</h1>
    <div class="summary">
      <p>Host count: {{len(host_list)}}</p>
      <p>Active: {{len(active_macs)}}</p>
    </div>
    <div>
    % if len(host_list) > 0:
      <table id="mactable">
        <tr>
          <th>Hostname</th>
          <th>MAC</th>
          <th>Last Active</th>
        </tr>
        % for host in host_list:
        <tr mac="{{host['mac']}}">
          <td>{{host['name']}}</td>
          <td><a href="{{'/host/{}'.format(host['mac'])}}">{{host['mac']}}</a></td>
          <td class="last_active">
          {{host['last_active']}}
          </td>
        </tr>
        % end
      </table>
    % else:
      <p> No hosts. </p>
    % end
    </div>
    <script src="/static/js/index.js"></script>
  </body>
</html>
