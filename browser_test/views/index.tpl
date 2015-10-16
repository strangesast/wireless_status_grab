<html>
  <head>
  <style>
    .recent::after {
      content: "  ⌂";
    }
  </style>
  </head>
  <body>
    <h2>Client List</h2>
    <div>
    <p>Host count: {{len(host_list)}}</p>
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
          <td class="last_active"></td>
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
