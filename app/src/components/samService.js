const config = require('config');
const axios = require('axios');
const errorToProblem = require('./errorToProblem');
const SERVICE = 'SAMService';
import https from 'https';

class SAMService {
  constructor({ username, password, apiUrl }) {
    if (!username || !password || !apiUrl) {
      throw new Error('SAM service is not configured. Check configuration.');
    }
    this.username = username;
    this.password = password;
    this.apiUrl = apiUrl;
  }

  async getUserPermissions(guid) {
    try {
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      const { data } = await axios.get(this.apiUrl, {
        params: { userGUID: guid, isIDIR: false },
        auth: {
          username: this.username,
          password: this.password,
        },
        httpsAgent: agent,
      });
      return data;
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }
}

const username = config.get('serviceClient.oes.sam.username');
const password = config.get('serviceClient.oes.sam.password');
const apiUrl = config.get('serviceClient.oes.sam.apiUrl');

let samService = new SAMService({ username: username, password: password, apiUrl: apiUrl });
module.exports = samService;
