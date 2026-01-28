const config = require('config');
const axios = require('axios');
const errorToProblem = require('./errorToProblem');
const SERVICE = 'GeoAddressService';
const moment = require('moment');

class CFMSService {
  constructor({ username, password, apiUrl }) {
    if (!username || !password || !apiUrl) {
      throw new Error('CFMS service is not configured. Check configuration.');
    }
    this.username = username;
    this.password = password;
    this.apiUrl = apiUrl;
  }

  async submitApplication(xml) {
    try {
      const headers = {
        'Content-Type': 'application/soap+xml',
      };
      return new Promise((resolve, reject) => {
        axios({
          method: 'post',
          auth: { username: this.username, password: this.password },
          url: this.apiUrl,
          headers,
          data: xml,
          timeout: 10000,
        })
          .then((response) => {
            resolve({
              response: {
                body: response.data,
                statusCode: response.status,
              },
            });
          })
          .catch((error) => {
            if (error.response) {
              console.log(`SOAP fail: ${error}`);
              reject(error.response.data);
            } else {
              console.log(`SOAP FAIL: ${error}`);
              reject(error);
            }
          });
      });
    } catch (e) {
      errorToProblem(SERVICE, e);
    }
  }

  async prepareSubmission(cfmsId, currentUser, submissionData) {
    delete submissionData.lateEntry;
    delete submissionData.submit;
    delete submissionData.emailAddress1;
    delete submissionData.next;

    if (submissionData.pastAgreementsContainer?.CEPPPEndDate1)
      submissionData.pastAgreementsContainer.CEPPPEndDate1 = moment(submissionData.pastAgreementsContainer.CEPPPEndDate1).format('MM/DD/YYYY');
    if (submissionData.pastAgreementsContainer?.CEPPPEndDate2)
      submissionData.pastAgreementsContainer.CEPPPEndDate2 = moment(submissionData.pastAgreementsContainer.CEPPPEndDate2).format('MM/DD/YYYY');
    if (submissionData.pastAgreementsContainer?.CEPPPEndDate3)
      submissionData.pastAgreementsContainer.CEPPPEndDate3 = moment(submissionData.pastAgreementsContainer.CEPPPEndDate3).format('MM/DD/YYYY');
    if (submissionData.CEPProjectStartDate) submissionData.CEPProjectStartDate = moment(submissionData.CEPProjectStartDate).format('MM/DD/YYYY');
    if (submissionData.CEPProjectEndDate) submissionData.CEPProjectEndDate = moment(submissionData.CEPProjectEndDate).format('MM/DD/YYYY');

    const xml = `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:tem="http://tempuri.org/">
        <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing" xmlns:wsrm="http://docs.oasis-open.org/ws-rx/wsrm/200702"><wsrm:Sequence><wsrm:Identifier>Server Error</wsrm:Identifier><wsrm:MessageNumber>1</wsrm:MessageNumber></wsrm:Sequence><wsa:Action>http://tempuri.org/ICFM_Data_Services/ReceiveApplication</wsa:Action><wsa:MessageID>uuid:d02aec5a-7d6d-44c7-b235-86e6cd5cc871</wsa:MessageID><wsa:To>https://dev1-cfms.services.sd.gov.bc.ca/CFM_Data_Services.svc</wsa:To></soap:Header>
        <soap:Body>
          <tem:ReceiveApplication>
              <!--Optional:-->
              <tem:id>${cfmsId}</tem:id>
              <!--Optional:-->
              <tem:payload><![CDATA[<?xml version="1.0" encoding="UTF-8"?>
      <Results>
      <AopApplicationID>${cfmsId}</AopApplicationID>
      <Source>CHEFS</Source>
      <StorefrontId>103</StorefrontId>
      <AopBCEIDGUID>${currentUser.idpUserId}</AopBCEIDGUID>
      <AopStreamType>Community and Employer Partnership</AopStreamType>
      <AopBCEID>${currentUser.username}</AopBCEID>
      <CEPOrgLegalName>${submissionData.CEPOrgLegalName}</CEPOrgLegalName>
      <CEPOrgAdrUnit_Mail>111</CEPOrgAdrUnit_Mail>
      <CEPOrgAdrAddress1_Mail>369 Tyee Rd</CEPOrgAdrAddress1_Mail>
      <CEPOrgAdrAddress2_Mail>Bottom Floor</CEPOrgAdrAddress2_Mail>
      <CEPOrgAdrCity_Mail>Victoria</CEPOrgAdrCity_Mail>
      <CEPOrgAdrProvince_Mail>BC</CEPOrgAdrProvince_Mail>
      <CEPOrgAdrPostalCode_Mail>V9A0B6</CEPOrgAdrPostalCode_Mail>
      <CEPOrgEmail>${submissionData.CEPOrgEmail}</CEPOrgEmail>
      <CEPOrgWebSite>${submissionData.CEPOrgWebSite}</CEPOrgWebSite>
      <CEPBookkeeperName>${submissionData.CEPBookkeeperName}</CEPBookkeeperName>
      <CEPOrgMailingAddress/>
      <CEPSelfAssessmentCompleted>${submissionData.CEPSelfAssessmentCompleted}</CEPSelfAssessmentCompleted>
      <CEPProjectType>${submissionData.CEPProjectType}</CEPProjectType>
      <CEPOrgEligibleType>${submissionData.CEPOrgEligibleType}</CEPOrgEligibleType>
      <CEPPastProjects>${submissionData.CEPPastProjects}</CEPPastProjects>
      ${submissionData.pastAgreementsContainer?.CEPPPContract1 ? `<CEPPPContract1>${submissionData.pastAgreementsContainer.CEPPPContract1}</CEPPPContract1>` : ''}
      ${submissionData.pastAgreementsContainer?.CEPPPEndDate1 ? `<CEPPPEndDate1>${submissionData.pastAgreementsContainer.CEPPPEndDate1}</CEPPPEndDate1>` : ''}
      ${submissionData.pastAgreementsContainer?.CEPPPContract2 ? `<CEPPPContract2>${submissionData.pastAgreementsContainer.CEPPPContract2}</CEPPPContract2>` : ''}
      ${submissionData.pastAgreementsContainer?.CEPPPEndDate2 ? `<CEPPPEndDate2>${submissionData.pastAgreementsContainer.CEPPPEndDate2}</CEPPPEndDate2>` : ''}
      ${submissionData.pastAgreementsContainer?.CEPPPContract3 ? `<CEPPPContract3>${submissionData.pastAgreementsContainer.CEPPPContract3}</CEPPPContract3>` : ''}
      ${submissionData.pastAgreementsContainer?.CEPPPEndDate3 ? `<CEPPPEndDate3>${submissionData.pastAgreementsContainer.CEPPPEndDate3}</CEPPPEndDate3>` : ''}
      <ApplicationType>CEP</ApplicationType>
      <CEPAccountingContactEmail>${submissionData.CEPAccountingContactEmail}</CEPAccountingContactEmail>
      <CATUnionConcurrence/>
      <CEPContactEmail>${submissionData.CEPContactEmail}</CEPContactEmail>
      <CEPBookkeeperQualifications>${submissionData.CEPBookkeeperQualifications}</CEPBookkeeperQualifications>
      <CEPContactName>${submissionData.CEPContactName}</CEPContactName>
      <CEPContactPhone>${submissionData.CEPContactPhone}</CEPContactPhone>
      <CEPContactAltPhone>${submissionData.CEPContactAltPhone}</CEPContactAltPhone>
      <CEPBusinessNumber>${submissionData.CEPBusinessNumber}</CEPBusinessNumber>
      <CEPTaxAccountSuffix>${submissionData.CEPTaxAccountSuffix}</CEPTaxAccountSuffix>
      ${
        submissionData.amountOwingContainer?.amountOwing1?.CEPOweGovtAgency1
          ? `<CEPOweGovtAgency1>${submissionData.amountOwingContainer.amountOwing1.CEPOweGovtAgency1}</CEPOweGovtAgency1>`
          : ''
      }
      ${
        submissionData.amountOwingContainer?.amountOwing1?.CEPOweGovtType1
          ? `<CEPOweGovtType1>${submissionData.amountOwingContainer.amountOwing1.CEPOweGovtType1}</CEPOweGovtType1>`
          : ''
      }
      ${
        submissionData.amountOwingContainer?.amountOwing1?.CEPOweGovtAmount1
          ? `<CEPOweGovtAmount1>${submissionData.amountOwingContainer.amountOwing1.CEPOweGovtAmount1}</CEPOweGovtAmount1>`
          : ''
      }
      <CEPPBLMTTraining>${submissionData.CEPPBLMTTraining}</CEPPBLMTTraining>
      <CEPWorkSafeCoverage>${submissionData.CEPWorkSafeCoverage}</CEPWorkSafeCoverage>
      ${
        submissionData.worksafeCoverageHiddenLabel?.CEPWorkSafeNumber
          ? `<CEPWorkSafeNumber>${submissionData.worksafeCoverageHiddenLabel.CEPWorkSafeNumber}</CEPWorkSafeNumber>`
          : ''
      }
      ${submissionData.worksafeCoverageHiddenLabel?.CEPWorkSafeRate ? `<CEPWorkSafeRate>${submissionData.worksafeCoverageHiddenLabel.CEPWorkSafeRate}</CEPWorkSafeRate>` : ''}
      ${submissionData.CEPDisplacementExplanation ? `<CEPDisplacementExplanation>${submissionData.CEPDisplacementExplanation}</CEPDisplacementExplanation>` : ''}
      ${submissionData.CEPEPBCDeliveryOther ? `<CEPEPBCDeliveryOther>${submissionData.CEPEPBCDeliveryOther}</CEPEPBCDeliveryOther>` : ''}
      ${submissionData.CEPOtherGovtFundingExplanation ? `<CEPOtherGovtFundingExplanation>${submissionData.CEPOtherGovtFundingExplanation}</CEPOtherGovtFundingExplanation>` : ''}
      <CEPOrgMandate>${submissionData.CEPOrgMandate}</CEPOrgMandate>
      ${submissionData.CEPEPBCConflict ? `<CEPEPBCConflict>${submissionData.CEPEPBCConflict}</CEPEPBCConflict>` : ''}
      <CEPUnfairCompPBLMT>${submissionData.CEPUnfairCompPBLMT}</CEPUnfairCompPBLMT>
      ${submissionData.CEPWorksiteUnions ? `<CEPWorksiteUnions>${submissionData.CEPWorksiteUnions}</CEPWorksiteUnions>` : ''}
      ${submissionData.CEPDisputeExplanation ? `<CEPDisputeExplanation>${submissionData.CEPDisputeExplanation}</CEPDisputeExplanation>` : ''}
      <CEPOweGovt>${submissionData.CEPOweGovt}</CEPOweGovt>
      <CEPLiabilityInsurance>${submissionData.CEPLiabilityInsurance}</CEPLiabilityInsurance>
      <CEPExistingPolicy>${submissionData.CEPExistingPolicy}</CEPExistingPolicy>
      <CEPDisplacement>${submissionData.CEPDisplacement}</CEPDisplacement>
      <CEPEPBCDelivery>${submissionData.CEPEPBCDelivery}</CEPEPBCDelivery>
      <CEPOtherGovtFunding>${submissionData.CEPOtherGovtFunding}</CEPOtherGovtFunding>
      <CEPUnionized>${submissionData.CEPUnionized}</CEPUnionized>
      <CEPDisputeInProgress>${submissionData.CEPDisputeInProgress}</CEPDisputeInProgress>
      <CEPProjectDateRange/>
      <CEPObj_PBLMT_Objectives>${submissionData.CEPObj_PBLMT_Objectives}</CEPObj_PBLMT_Objectives>
      <CEPProjectTitle>${submissionData.CEPProjectTitle}</CEPProjectTitle>
      <CEPProjectStartDate>${submissionData.CEPProjectStartDate}</CEPProjectStartDate>
      <CEPProjectEndDate>${submissionData.CEPProjectEndDate}</CEPProjectEndDate>
      <CEPHasParticipants>${submissionData.CEPHasParticipants}</CEPHasParticipants>
      <CEPParticipantCount>${submissionData.CEPParticipantCount}</CEPParticipantCount>
      <CEPAlternateLocations>${submissionData.CEPAlternateLocations}</CEPAlternateLocations>
      <CEPTargetAboriginalCount/>
      <CEPTargetFrancophoneCount/>
      <CEPTargetImmigrantCount/>
      <CEPTargetBarrieredCount/>
      <CEPTargetDisabilitiesCount/>
      <CEPTargetYouthCount/>
      <CEPTargetLayoffCount/>
      <CATPartnerLetters/>
      <CEPPTimelinesActivities_PBLMT>${submissionData.CEPPTimelinesActivities_PBLMT}</CEPPTimelinesActivities_PBLMT>
      <CEPExpectedResults_PBLMT>${submissionData.CEPExpectedResults_PBLMT}</CEPExpectedResults_PBLMT>
      <CEPPBLMTClassPercent>${submissionData.CEPPBLMTClassPercent}</CEPPBLMTClassPercent>
      <CEPPBLMTWorkPercent>${submissionData.CEPPBLMTWorkPercent}</CEPPBLMTWorkPercent>
      <CEPJobDescriptions>${submissionData.CEPJobDescriptions}</CEPJobDescriptions>
      <CEPObj_PBLMT_Sessions>${submissionData.CEPObj_PBLMT_Sessions}</CEPObj_PBLMT_Sessions>
      <CEPObj_PBLMT_SessionCount>${submissionData.CEPObj_PBLMT_SessionCount}</CEPObj_PBLMT_SessionCount>
      <CEPObj_PBLMT_PartPerSessionCount>${submissionData.CEPObj_PBLMT_PartPerSessionCount}</CEPObj_PBLMT_PartPerSessionCount>
      <CEPObj_PBLMT_TrainingWeeks>${submissionData.CEPObj_PBLMT_TrainingWeeks}</CEPObj_PBLMT_TrainingWeeks>
      <CEPObj_PBLMT_FollowupWeeks>${submissionData.CEPObj_PBLMT_FollowupWeeks}</CEPObj_PBLMT_FollowupWeeks>
      <CEPPBLMT_PartBenefit>${submissionData.CEPPBLMT_PartBenefit}</CEPPBLMT_PartBenefit>
      <CEPObj_PBLMT_JobTypes>${submissionData.CEPObj_PBLMT_JobTypes}</CEPObj_PBLMT_JobTypes>
      <CEPObj_PBLMT_JobWeeks>${submissionData.CEPObj_PBLMT_JobWeeks}</CEPObj_PBLMT_JobWeeks>
      <CEPTaxRebate>${submissionData.CEPTaxRebate}</CEPTaxRebate>
      <CEPPBLMT_LabourMarket>${submissionData.CEPPBLMT_LabourMarket}</CEPPBLMT_LabourMarket>
      <CEPESC1>${submissionData.CEPESC1}</CEPESC1>
      ${submissionData.CEPESC2 ? `<CEPESC2>${submissionData.CEPESC2}</CEPESC2>` : ''}
      ${submissionData.CEPESC3 ? `<CEPESC3>${submissionData.CEPESC3}</CEPESC3>` : ''}
      ${submissionData.CEPESC4 ? `<CEPESC4>${submissionData.CEPESC4}</CEPESC4>` : ''}
      <CEPAttESC_Letters/>
      <CEPAttSupportLetters_PBLMT/>
      <CEPProgressExplanation>${submissionData.CEPProgressExplanation}</CEPProgressExplanation>
      <CEPFollowUpExplanation>${submissionData.CEPFollowUpExplanation}</CEPFollowUpExplanation>
      <CEPStakeholderPartnerships>${submissionData.CEPStakeholderPartnerships}</CEPStakeholderPartnerships>
      <CATBudget/>
      <CEPRequestedBudget>${submissionData.CEPRequestedBudget}</CEPRequestedBudget>
      <CATAdditionalDocs/>
      <ConsentCheckbox>${submissionData.ConsentCheckbox}</ConsentCheckbox>
    </Results>]]></tem:payload>
          </tem:ReceiveApplication>
        </soap:Body>
    </soap:Envelope>`;
    console.log('Prepared XML: ', xml);
    return xml;
  }
}

const username = config.get('serviceClient.oes.cfms.username');
const password = config.get('serviceClient.oes.cfms.password');
const apiUrl = config.get('serviceClient.oes.cfms.apiUrl');

let cfmsService = new CFMSService({ username: username, password: password, apiUrl: apiUrl });
module.exports = cfmsService;
