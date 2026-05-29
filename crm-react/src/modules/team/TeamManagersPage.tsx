import React from 'react';

interface Manager {
  userId: number;
  username: string;
  email: string;
  role: string;
}

const TeamManagersPage: React.FC = () => {
  const [managers, setManagers] = React.useState<Manager[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    let aborted = false;
    setLoading(true);
    setError('');

    const baseUrl = '';
    
    fetch(`${baseUrl}/api/users/sales-managers`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data: Manager[]) => {
        if (!aborted) setManagers(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!aborted) setError(e?.message || 'Failed to load managers');
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });

    return () => {
      aborted = true;
    };
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Managers</h1>
          <p className="text-gray-600 mt-1">List of all sales managers</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        {loading && <p className="text-gray-600">Loading managers...</p>}
        {error && !loading && (
          <p className="text-red-600">{error}</p>
        )}
        {!loading && !error && (
          managers.length === 0 ? (
            <p className="text-gray-600">No managers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {managers.map((m) => (
                    <tr key={m.userId}>
                      <td className="px-4 py-2 text-sm text-gray-900">{m.userId}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{m.username}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{m.email}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{m.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default TeamManagersPage;
