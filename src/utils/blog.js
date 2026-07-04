import dayjs from 'dayjs'

const STATUS_MAP = {
  '0': { text: '草稿', type: 'info' },
  '1': { text: '已发布', type: 'success' },
  '2': { text: '待审核', type: 'warning' },
  '3': { text: '审核不通过', type: 'danger' }
}

export function getBlogStatusText(status) {
  return STATUS_MAP[String(status)]?.text || '未知状态'
}

export function getBlogStatusType(status) {
  return STATUS_MAP[String(status)]?.type || 'info'
}

export function formatBlogDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return '-'
  return dayjs(date).isValid() ? dayjs(date).format(format) : '-'
}

export function formatBlogDateCN(date) {
  return formatBlogDate(date, 'YYYY年MM月DD日 HH:mm')
}