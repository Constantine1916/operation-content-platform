const formatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatBeijingDateTime(value?: string | null) {
  if (!value) {
    return '未知';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '未知';
  }

  const partMap = formatter
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  return `${partMap.year}/${partMap.month}/${partMap.day} ${partMap.hour}:${partMap.minute}`;
}
