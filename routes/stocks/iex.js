const axios = require('axios');

const axiosInstance = axios.create({
  baseURL: 'https://cloud.iexapis.com/v1/stock',
  /* other custom settings */
});

module.exports = axiosInstance;

'/bac/batch?&types=quote,news,chart&range=1m&last=5&token=pk_3110c774ae6b43e290aa8e16ee224258'

