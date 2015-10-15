<html>
  <body>
    <h1>
      <small>Summary for </small>
      {{host['host']['name'] if not host['host']['name'] in ['*', ''] else host['host']['mac']}}</h1>
    % if len(host['records']) > 0:
        <table>
          <tr>
            <th>Time</th>
            <th>Strength</th>
          </tr>
          % for host in host['records']:
          <tr>
            <td>{{host['time']}}</td>
            <td>{{host['strength']}}</td>
          </tr>
          % end
        </table>
    % end
  </body>
</html>
