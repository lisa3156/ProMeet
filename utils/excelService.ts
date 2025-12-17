import { Attendee } from "../types";

export const exportToExcel = (meetingTitle: string, attendees: Attendee[]) => {
  if (!window.XLSX) {
    alert("Excel组件未正确加载。");
    return;
  }

  // Format data for business view in Chinese
  const data = attendees.map(a => ({
    "部门": a.department,
    "职务": a.jobTitle,
    "参会人姓名": a.name,
    "部门联系人": a.contactName,
    "联系电话": a.phone,
    "已通知": a.isNotified ? "是" : "否",
    "收到回执": a.hasRsvp ? "是" : "否",
    "出席状态": a.status === 'present' ? '出席' : a.status === 'leave' ? '请假' : '待定',
    "请假事由": a.leaveReason || ""
  }));

  const worksheet = window.XLSX.utils.json_to_sheet(data);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, "参会名单");
  
  // Clean filename
  const filename = `${meetingTitle.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '_')}_名单.xlsx`;
  window.XLSX.writeFile(workbook, filename);
};

export const importFromExcel = (file: File): Promise<Partial<Attendee>[]> => {
  return new Promise((resolve, reject) => {
    if (!window.XLSX) {
      reject("Excel组件未加载。");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = window.XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = window.XLSX.utils.sheet_to_json(sheet);

        // Map loosely to our structure, supporting both English and Chinese headers
        const mappedData: Partial<Attendee>[] = jsonData.map((row: any) => {
          const statusRaw = row['Attendance Status'] || row['出席状态'];
          let statusValue = 'pending';
          
          if (statusRaw === 'Present' || statusRaw === '出席') statusValue = 'present';
          else if (statusRaw === 'On Leave' || statusRaw === '请假') statusValue = 'leave';
          
          return {
            department: row['Department'] || row['department'] || row['部门'] || "",
            jobTitle: row['Job Title'] || row['jobTitle'] || row['职务'] || "",
            name: row['Name'] || row['name'] || row['姓名'] || row['参会人姓名'] || "",
            contactName: row['Contact Person'] || row['contactName'] || row['部门联系人'] || row['联系人'] || "",
            phone: row['Phone'] || row['phone'] || row['电话'] || row['联系电话'] || row['手机'] || "",
            isNotified: (row['Notified'] === 'Yes' || row['Notified'] === true || row['已通知'] === '是' || row['已通知'] === true),
            hasRsvp: (row['RSVP Received'] === 'Yes' || row['RSVP'] === true || row['收到回执'] === '是' || row['收到回执'] === true),
            status: statusValue as any,
            leaveReason: row['Leave Reason'] || row['请假事由'] || ""
          };
        });

        resolve(mappedData);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};