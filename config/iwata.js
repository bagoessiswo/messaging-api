module.exports = {
  application: {
    header: {
      apps: 'x-iwata-app',
      version: 'x-iwata-app-version',
      auth: 'Authorization'
    },
    type: {
      mobile: {
        android: {
          user: 'sales-crm-android'
        },
        ios: {
          user: 'sales-crm-ios'
        }
      }
    },
    origins: [
      'http://127.0.0.1:3000',
      'http://127.0.0.1'
    ]
  },
  media: {
    image_max_size: 5000000,
    video_max_size: 30000000,
    image_mime_types: [
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'video/mp4'
    ],
    video_mime_types: [
      'video/mp4',
      'video/x-flv',
      'video/mp4',
      'application/x-mpegURL',
      'video/MP2T',
      'video/3gpp',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv'
    ],
    path: {
      visitation_plan_reports: '/visitation_plan_reports/',
      contacts: '/contacts/',
      contact_conditions: '/contacts/conditions/',
      attendances: '/attendances/'
    }
  },
  data: {
    limit_pagination: 10,
    work_latitude: '-7.3521352',
    work_longitude: '112.766239',
    minimal_attendance_distance: 10, // in meter
    maximum_late: 30 // in minutes
  },
  localization: {
    indonesia: 'id',
    english: 'en'
  }

}
