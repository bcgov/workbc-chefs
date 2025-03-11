import formioUtils from 'formiojs/utils';
import moment from 'moment';
import { IdentityMode } from '~/utils/constants';

//
// Transformation Functions for converting form objects
//

/**
 * @function generateIdps
 * Converts idps and userType to identity provider objects
 * @param {String[]} idps A string array of identity providers
 * @param {String} userType The type of users
 * @returns {Object[]} An object array of identity providers
 */
export function generateIdps({ idps, userType }) {
  let identityProviders = [];
  if (userType === IdentityMode.LOGIN && idps && idps.length) {
    identityProviders = identityProviders.concat(
      idps.map((i) => ({ code: i }))
    );
  } else if (userType === IdentityMode.PUBLIC) {
    identityProviders.push({ code: IdentityMode.PUBLIC });
  }
  return identityProviders;
}

/**
 * @function parseIdps
 * Converts identity provider objects to idps and userType
 * @param {Object[]} identityProviders An object array of identity providers
 * @returns {Object} An object containing idps and userType
 */
export function parseIdps(identityProviders) {
  const result = {
    idps: [],
    userType: IdentityMode.TEAM,
  };
  if (identityProviders && identityProviders.length) {
    if (identityProviders[0].code === IdentityMode.PUBLIC) {
      result.userType = IdentityMode.PUBLIC;
    } else {
      result.userType = IdentityMode.LOGIN;
      result.idps = identityProviders.map((ip) => ip.code);
    }
  }
  return result;
}

/**
 * @function attachAttributesToLinks
 * Attaches attributes to <a> Link tags to open in a new tab
 * @param {Object[]} formSchemaComponents An array of Components
 */
export function attachAttributesToLinks(formSchemaComponents) {
  const simpleContentComponents = formioUtils.searchComponents(
    formSchemaComponents,
    {
      type: 'simplecontent',
    }
  );
  const advancedContent = formioUtils.searchComponents(formSchemaComponents, {
    type: 'content',
  });
  const combinedLinks = [...simpleContentComponents, ...advancedContent];

  combinedLinks.forEach((component) => {
    if (component.html && component.html.includes('<a ')) {
      component.html = component.html.replace(
        /<a(?![^>]+target=)/g,
        '<a target="_blank" rel="noopener"'
      );
    }
  });
}

/**
 * @function getSubmissionPeriodDates
 * Gets all possible dates for a submission period
 *
 * @param {Integer} keepOpenForTerm A submission period's number of period intervals
 * @param {String} keepOpenForInterval A submission period's intervals which can be days, weeks, months, or years
 * @param {Object} openSubmissionDateTime A moment object of the day the form will be open for submissions
 * @param {Integer} repeatSubmissionTerm A submission period's number of repeat intervals
 * @param {String} repeatSubmissionInterval A submission period's repeat intervals which can be days, weeks, months, or years
 * @param {Integer} allowLateTerm A late submission's number of period intervals
 * @param {String} allowLateInterval A late submission's intervals which can be days, weeks, months, or years
 * @param {Object} repeatSubmissionUntil A moment of the day that a submission period will stop repeat intervals
 * @returns {Object} An object array of available dates in given period
 */
export function getSubmissionPeriodDates(
  keepOpenForTerm = 0,
  keepOpenForInterval = 'days',
  openSubmissionDateTime,
  repeatSubmissionTerm = null,
  repeatSubmissionInterval = null,
  allowLateTerm = null,
  allowLateInterval = null,
  repeatSubmissionUntil
) {
  let submissionPeriodDates = [];
  let openSubmissionDate = moment.isMoment(openSubmissionDateTime)
    ? openSubmissionDateTime.clone()
    : moment(new Date(openSubmissionDateTime));
  let calculatedCloseDate = openSubmissionDate.clone();
  repeatSubmissionUntil = moment.isMoment(repeatSubmissionUntil)
    ? repeatSubmissionUntil.clone()
    : moment(new Date(repeatSubmissionUntil));
  let graceDate = null;

  calculatedCloseDate.add(keepOpenForTerm, keepOpenForInterval);
  if (allowLateTerm && allowLateInterval)
    graceDate = calculatedCloseDate
      .clone()
      .add(allowLateTerm, allowLateInterval)
      .format('YYYY-MM-DD HH:MM:SS');

  // Always push through the first submission period
  submissionPeriodDates.push({
    startDate: openSubmissionDate.clone().format('YYYY-MM-DD HH:MM:SS'),
    closeDate: calculatedCloseDate.format('YYYY-MM-DD HH:MM:SS'),
    graceDate: graceDate,
  });

  // If repeat periods are enabled
  if (
    repeatSubmissionTerm &&
    repeatSubmissionInterval &&
    repeatSubmissionUntil
  ) {
    // Reset the calculated closing date to the open date
    calculatedCloseDate = openSubmissionDate.clone();
    // This checks that we're not repeating it again if the close date is before
    // the repeat end date.
    while (
      calculatedCloseDate
        .clone()
        .add(repeatSubmissionTerm, repeatSubmissionInterval)
        .isBefore(repeatSubmissionUntil)
    ) {
      // Add the repeat period to the open submission date to determine the open submission date
      openSubmissionDate.add(repeatSubmissionTerm, repeatSubmissionInterval);
      // Calculated closing date is now the openSubmission date with the keep open period
      calculatedCloseDate = openSubmissionDate
        .clone()
        .add(keepOpenForTerm, keepOpenForInterval);
      // If late submissions are enabled, set the grace period equal to the closing date
      // with the addition of the late period
      if (allowLateTerm && allowLateInterval)
        graceDate = calculatedCloseDate
          .clone()
          .add(allowLateTerm, allowLateInterval)
          .format('YYYY-MM-DD HH:MM:SS');

      // Add the calculated dates to the submission period array
      submissionPeriodDates.push({
        startDate: openSubmissionDate.clone().format('YYYY-MM-DD HH:MM:SS'),
        closeDate: calculatedCloseDate.format('YYYY-MM-DD HH:MM:SS'),
        graceDate: graceDate,
      });

      // Set the calculated closing date equal to the open date again for the repeat submission check
      calculatedCloseDate = openSubmissionDate.clone();
    }
  }

  return submissionPeriodDates;
}

/**
 * @function isDateValidForMailNotification
 * Check if date is equal or less than today
 *
 * @param {String} parseDate A string of start date period
 */
export function isDateValidForMailNotification(parseDate) {
  const formDate = moment(parseDate, 'YYYY-MM-DD');
  const now = moment();
  if (now.isSameOrAfter(formDate, 'day')) {
    return true;
  }
  return false;
}

// disposition retrieval from https://stackoverflow.com/a/40940790
export function getDisposition(disposition) {
  if (disposition && disposition.indexOf('attachment') !== -1) {
    let filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    let matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      disposition = matches[1].replace(/['"]/g, '');
    }
  }
  return disposition;
}

export function filterObject(_itemTitle, queryText, item) {
  return Object.values(item)
    .filter((v) => v)
    .some((v) => {
      if (typeof v === 'string')
        return v.toLowerCase().includes(queryText.toLowerCase());
      else {
        return Object.values(v).some(
          (nestedValue) =>
            typeof nestedValue === 'string' &&
            nestedValue.toLowerCase().includes(queryText.toLowerCase())
        );
      }
    });
}

export function splitFileName(filename = undefined) {
  let name = undefined;
  let extension = undefined;

  if (filename) {
    const filenameArray = filename.split('.');
    name = filenameArray.slice(0, -1).join('.');
    extension = filenameArray.slice(-1).join('.');
  }

  return { name, extension };
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.replace(/^.*,/, ''));
    reader.onerror = (error) => reject(error);
  });
}

/**
 * @function getAvailableDates
 * Get All possible dates in given period with Term and Interval
 *
 * @param {Integer} keepAliveFor An integer for number of days, that tells form to be open for a particular period
 * @param {String} keepAliveForInterval A string of days,Weeks,months, that tells form to be open for a particular period
 * @param {Object[]} formStartDate An object of Moment JS date, that tells form to be open on a particular day/date
 * @param {Integer} term An integer of number of Days/Weeks OR Years, that tells form to be repeated on a particular period
 * @param {String} interval A string of days,Weeks,months, that tells form to be repeated on a particular period
 * @param {Integer} allowLateTerm An integer of number of Days/Weeks OR Years, that tells form to be allowed for late submission for a particular period
 * @param {String} allowLateInterval A string of days,Weeks,months, that tells form to be allowed for late submission for a particular period
 * @param {Object[]} repeatUntil An object of Moment JS date, that tells form to be finally close after repetition on particular day date
 * @param {String} scheduleType A string one of Manual, ClosingDate OR Period
 * @param {Object[]} closeDate An object of Moment JS date, Forms closing date
 * @returns {Object[]} An object array of Available dates in given period
 */
export function getAvailableDates(
  keepAliveFor = 0,
  keepAliveForInterval = 'days',
  formStartDate,
  term = null,
  interval = null,
  allowLateTerm = null,
  allowLateInterval = null,
  repeatUntil,
  scheduleType,
  closeDate = null
) {
  let substartDate = moment(formStartDate);
  repeatUntil = moment(repeatUntil);
  let calculatedsubcloseDate = getCalculatedCloseSubmissionDate(
    substartDate,
    keepAliveFor,
    keepAliveForInterval,
    allowLateTerm,
    allowLateInterval,
    term,
    interval,
    repeatUntil,
    scheduleType,
    closeDate
  );
  let availableDates = [];
  if (calculatedsubcloseDate && term && interval) {
    while (substartDate.isBefore(calculatedsubcloseDate)) {
      let newDate = substartDate.clone();
      if (substartDate.isBefore(repeatUntil)) {
        availableDates.push(
          Object({
            startDate: substartDate.format('YYYY-MM-DD HH:MM:SS'),
            closeDate: newDate
              .add(keepAliveFor, keepAliveForInterval)
              .format('YYYY-MM-DD HH:MM:SS'),
            graceDate: newDate
              .add(allowLateTerm, allowLateInterval)
              .format('YYYY-MM-DD HH:MM:SS'),
          })
        );
      }
      substartDate.add(term, interval);
    }
  }

  if (
    term == null &&
    interval == null &&
    keepAliveFor &&
    keepAliveForInterval
  ) {
    let newDates = substartDate.clone();
    availableDates.push(
      Object({
        startDate: substartDate.format('YYYY-MM-DD HH:MM:SS'),
        closeDate: newDates
          .add(keepAliveFor, keepAliveForInterval)
          .format('YYYY-MM-DD HH:MM:SS'),
        graceDate:
          allowLateTerm && allowLateInterval
            ? newDates
                .add(allowLateTerm, allowLateInterval)
                .format('YYYY-MM-DD HH:MM:SS')
            : null,
      })
    );
  }
  return availableDates;
}

/**
 * @function getCalculatedCloseSubmissionDate
 * Get calculated Close date for a Form schedule setting with the given scenario
 *
 * @param {Object[]} openedDate An object of Moment JS date
 * @param {Integer} keepOpenForTerm keepOpenForTerm An integer of number of Days/Weeks OR Years, that tells form to be open for a particular period
 * @param {String} keepOpenForInterval keepOpenForInterval A string of days,Weeks,months, that tells form to be open for a particular period
 * @param {Integer} allowLateTerm An integer of number of Days/Weeks OR Years, that tells form to be allowed for late submission for a particular period
 * @param {String} allowLateInterval A string of days,Weeks,months, that tells form to be allowed for late submission for a particular period
 * @param {Integer} repeatSubmissionTerm An integer of number of Days/Weeks OR Years, that tells form to be repeated for a particular period
 * @param {String} repeatSubmissionInterval A string of days,Weeks,months, that tells form to be repeated for a particular period
 * @param {Object[]} repeatSubmissionUntil An object of Moment JS date, that tells form to be finally close after repetition on particular day date
 * @returns {Object[]} An object of Moment JS date
 */
export function getCalculatedCloseSubmissionDate(
  openedDate = moment(),
  keepOpenForTerm = 0,
  keepOpenForInterval = 'days',
  allowLateTerm = 0,
  allowLateInterval = 'days',
  repeatSubmissionTerm = 0,
  repeatSubmissionInterval = 'days',
  repeatSubmissionUntil = moment()
) {
  const openDate = moment(openedDate).clone();
  let calculatedCloseDate = moment(openDate);
  repeatSubmissionUntil = moment(repeatSubmissionUntil);
  if (
    !allowLateTerm &&
    !allowLateInterval &&
    !repeatSubmissionTerm &&
    !repeatSubmissionInterval
  ) {
    calculatedCloseDate = openDate
      .add(keepOpenForTerm, keepOpenForInterval)
      .format('YYYY-MM-DD HH:MM:SS');
  } else {
    if (
      repeatSubmissionTerm &&
      repeatSubmissionInterval &&
      repeatSubmissionUntil
    ) {
      calculatedCloseDate = repeatSubmissionUntil;
    }
    if (allowLateTerm && allowLateInterval) {
      calculatedCloseDate = calculatedCloseDate
        .add(keepOpenForTerm, keepOpenForInterval)
        .add(allowLateTerm, allowLateInterval)
        .format('YYYY-MM-DD HH:MM:SS');
    }
  }
  return calculatedCloseDate;
}

/**
 * @function calculateCloseDate
 * Get close date when provided a given period for late submission
 * @param {Integer} subCloseDate An object of Moment JS date, Forms closing date
 * @param {Integer} allowLateTerm An integer of number of Days/Weeks OR Years, that tells form to be allowed for late submission for a particular period
 * @param {String} allowLateInterval A string of days,Weeks,months, that tells form to be allowed for late submission for a particular period
 * @param {Integer} subCloseDate An object of Moment JS date, Forms closing date
 * @param {Integer} allowLateTerm An integer of number of Days/Weeks OR Years, that tells form to be allowed for late submission for a particular period
 * @param {String} allowLateInterval A string of days,Weeks,months, that tells form to be allowed for late submission for a particular period
 */
export function calculateCloseDate(
  subCloseDate = moment(),
  allowLateTerm = null,
  allowLateInterval = null
) {
  let closeDate = moment(subCloseDate);
  const closeDateRet = closeDate
    .add(allowLateTerm, allowLateInterval)
    .format('YYYY-MM-DD HH:MM:SS');
  return closeDateRet;
}