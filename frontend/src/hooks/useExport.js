import { useCallback } from 'react';

export function useExport() {
  const exportToCSV = useCallback((data = [], columns = [], filename = 'export') => {
    if (!data.length || !columns.length) return;

    const visibleCols = columns.filter(c => c.visible !== false && c.key !== 'actions');
    
    // Header row
    const headers = visibleCols.map(c => `"${(c.title || c.header || c.key).replace(/"/g, '""')}"`).join(',');

    // Data rows
    const rows = data.map(item => {
      return visibleCols.map(c => {
        let val = '';
        if (c.getValue) {
          val = c.getValue(item);
        } else if (c.accessor) {
          val = c.accessor(item);
        } else {
          val = item[c.key];
        }

        if (val === undefined || val === null) val = '';
        // Format objects/arrays to text
        if (typeof val === 'object') {
          val = JSON.stringify(val);
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportToExcel = useCallback((data = [], columns = [], filename = 'export') => {
    if (!data.length || !columns.length) return;

    const visibleCols = columns.filter(c => c.visible !== false && c.key !== 'actions');

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Sheet1">
  <Table>
   <Row>`;

    visibleCols.forEach(c => {
      const headerText = c.title || c.header || c.key;
      xml += `<Cell><Data ss:Type="String">${escapeXml(headerText)}</Data></Cell>`;
    });
    xml += `</Row>`;

    data.forEach(item => {
      xml += `<Row>`;
      visibleCols.forEach(c => {
        let val = '';
        if (c.getValue) {
          val = c.getValue(item);
        } else if (c.accessor) {
          val = c.accessor(item);
        } else {
          val = item[c.key];
        }

        if (val === undefined || val === null) val = '';
        const isNum = typeof val === 'number' && !isNaN(val);
        const type = isNum ? 'Number' : 'String';
        const formattedVal = isNum ? val : escapeXml(String(val));
        
        xml += `<Cell><Data ss:Type="${type}">${formattedVal}</Data></Cell>`;
      });
      xml += `</Row>`;
    });

    xml += `</Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0,10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return {
    exportToCSV,
    exportToExcel
  };
}

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default useExport;
