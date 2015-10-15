<html>
  <body>
    <h2>Client List</h2>
    <div>
    <p>Host count: {{len(host_list)}}</p>
    % if len(host_list) > 0:
      <table>
        <tr>
          <th>Hostname</th>
          <th>MAC</th>
        </tr>
        % for host in host_list:
        <tr>
          <td>{{host['name']}}</td>
          <td><a href="{{'/host/{}'.format(host['mac'])}}">{{host['mac']}}</a></td>
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
