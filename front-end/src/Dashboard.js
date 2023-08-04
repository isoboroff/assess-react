import React, { useEffect, useState } from 'react';
import DataTable from 'react-data-table-component';

function DashboardApp(props) {
  const [data, setData] = useState({});
  const [pending, setPending] = useState(true);

  const columns = [
    {
      name: 'Topic',
      selector: row => row.topic,
      sortable: true,
    },
    {
      name: 'Assessor',
      selector: row => row.assr,
      sortable: true,
    },
    {
      name: 'Size',
      selector: row => row.num_docs,
      sortable: true,
    },
    {
      name: 'Relevant',
      selector: row => row.num_rel,
      sortable: true,
    },
    {
      name: '%Relevant',
      selector: row => row.pct_rel,
      sortable: true,
      format: row => row.pct_rel.toFixed(2).concat('%'),
    },
    {
      name: 'Left to do',
      selector: row => row.num_left,
      sortable: true,
    },
    {
      name: 'Last update',
      selector: row => row.stamp,
      sortable: true,
      format: row => {
        if (row.stamp == 0) { return '' } else { return row.timedate };
      }
    },
  ];

  useEffect(() => {
    fetch('dashdata')
      .then(response => response.json())
      .then(new_data => {
        setData(new_data);
        setPending(false);
      });
  }, []);

  return (
    <DataTable
      columns={columns}
      data={data}
      progressPending={pending}
      striped={true}
      highlightOnHover={true}
    />
  );
};

export { DashboardApp as default };
