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
          <td><a href="{{'/host/{}'.format(host['mac'])}}">{{host['name']}}</a></td>
          <td>{{host['mac']}}</td>
        </tr>
        % end
      </table>
    % else:
      <p> No hosts. </p>
    % end
    </div>
  </body>
</html>
