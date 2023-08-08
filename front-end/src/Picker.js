import React, { useEffect, useState, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { resolvePath } from 'react-router-dom';

function PickerApp(props) {
  const [data, setData] = useState([]);
  const [pending, setPending] = useState(true);
  const [user, setUser] = useState('');

  const columns = [
    {
      name: 'Number',
      selector: row => row.id,
      sortable: true,
      width: "150px",
    },
    {
      name: 'Query',
      selector: row => row.query,
      sortable: true,
    },
  ];

  const handleRowSelected = async (row, event) => {
    if (window.confirm(`Confirm selection: ${row.query}`)) {
      await fetch('pick?u=' + user + '&t=' + row.id);
      window.location.href = resolvePath('/').pathname;
    }
  };

  useEffect(() => {
    const user = window.localStorage.getItem('user');
    if (user) {
      setUser(user);
    } else {
      window.location.href = resolvePath('/').pathname;
    }
  }, []);

  useEffect(() => {
    fetch('pickdata')
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
      highlightOnHover
      striped
      defaultSortFieldId={1}
      onRowClicked={handleRowSelected}
    />
  );
};

export { PickerApp as default };
