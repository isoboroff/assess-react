import React, { useEffect, useState, useCallback, useMemo } from 'react';
import DataTable from 'react-data-table-component';

function PickerApp(props) {
  const [data, setData] = useState([]);
  const [pending, setPending] = useState(true);

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
      await fetch('pick?u=' + props.username + '&t=' + row.id);
      props.set_show_picker_dialog(false);
      props.load_pool(row.id);
    }
  };

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
