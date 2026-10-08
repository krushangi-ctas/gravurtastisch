// @ts-nocheck
const concateDate = function (date) {
  return {
    $dateToString: {
      format: '%d-%m-%Y',
      date: date,
      timezone: 'Asia/Kolkata',
    },
  };
};

const concateDateWithTime = function (date) {
  return {
    $dateToString: {
      format: '%d-%m-%Y %H:%M:%S',
      date: date,
      timezone: 'Asia/Kolkata',
    },
  };
};

module.exports = {
  concateDate,
  concateDateWithTime,
};
