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
          timeout: 60000,
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

    // console.log(
    //   'ADDR FIELDS: ',
    //   submissionData.address_container.CEPOrgAdrUnit_Mail,
    //   submissionData.address_container.CEPOrgAdrAddress1_Mail,
    //   submissionData.address_container.CEPOrgAdrAddress2_Mail,
    //   submissionData.address_container.CEPOrgAdrCity_Mail,
    //   submissionData.address_container.CEPOrgAdrProvince_Mail,
    //   submissionData.address_container.CEPOrgAdrPostalCode_Mail
    // );

    // ${submissionData. ? `` : ''}

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
      <CEPOrgAdrUnit_Mail>${submissionData.address_container?.CEPOrgAdrUnit_Mail}</CEPOrgAdrUnit_Mail>
      <CEPOrgAdrAddress1_Mail>${submissionData.address_container?.CEPOrgAdrAddress1_Mail}</CEPOrgAdrAddress1_Mail>
      <CEPOrgAdrAddress2_Mail>${submissionData.address_container?.CEPOrgAdrAddress2_Mail}</CEPOrgAdrAddress2_Mail>
      <CEPOrgAdrCity_Mail>${submissionData.address_container?.CEPOrgAdrCity_Mail}</CEPOrgAdrCity_Mail>
      <CEPOrgAdrProvince_Mail>${submissionData.address_container?.CEPOrgAdrProvince_Mail}</CEPOrgAdrProvince_Mail>
      <CEPOrgAdrPostalCode_Mail>${submissionData.address_container?.CEPOrgAdrPostalCode_Mail}</CEPOrgAdrPostalCode_Mail>
      <CEPOrgEmail>${submissionData.CEPOrgEmail}</CEPOrgEmail>
      <CEPOrgWebSite>${submissionData.CEPOrgWebSite}</CEPOrgWebSite>
      <CEPBookkeeperName>${submissionData.CEPBookkeeperName}</CEPBookkeeperName>
      <CEPOrgMailingAddress/>
      <CEPProjectType>${submissionData.CEPProjectType}</CEPProjectType>
      <CEPOrgEligibleType>${submissionData.CEPOrgEligibleType}</CEPOrgEligibleType>
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
      ${submissionData.CEPPBLMTTraining ? `<CEPPBLMTTraining>${submissionData.CEPPBLMTTraining}</CEPPBLMTTraining>` : ''}
      <CEPWorkSafeCoverage>${submissionData.CEPWorkSafeCoverage}</CEPWorkSafeCoverage>
      ${
        submissionData.worksafeCoverageHiddenLabel?.CEPWorkSafeNumber
          ? `<CEPWorkSafeNumber>${submissionData.worksafeCoverageHiddenLabel.CEPWorkSafeNumber}</CEPWorkSafeNumber>`
          : ''
      }
      ${submissionData.worksafeCoverageHiddenLabel?.CEPWorkSafeRate ? `<CEPWorkSafeRate>${submissionData.worksafeCoverageHiddenLabel.CEPWorkSafeRate}</CEPWorkSafeRate>` : ''}
      ${submissionData.CEPDisplacementExplanation ? `<CEPDisplacementExplanation>${submissionData.CEPDisplacementExplanation}</CEPDisplacementExplanation>` : ''}
      ${submissionData.CEPWORKBCDeliveryOther ? `<CEPWORKBCDeliveryOther>${submissionData.CEPWORKBCDeliveryOther}</CEPWORKBCDeliveryOther>` : ''}
      ${submissionData.CEPOtherGovtFundingExplanation ? `<CEPOtherGovtFundingExplanation>${submissionData.CEPOtherGovtFundingExplanation}</CEPOtherGovtFundingExplanation>` : ''}
      ${submissionData.CEPOrgMandate ? `<CEPOrgMandate>${submissionData.CEPOrgMandate}</CEPOrgMandate>` : ''}
      ${submissionData.CEPEPBCConflict ? `<CEPEPBCConflict>${submissionData.CEPEPBCConflict}</CEPEPBCConflict>` : ''}
      ${submissionData.CEPUnfairCompPBLMT ? `<CEPUnfairCompPBLMT>${submissionData.CEPUnfairCompPBLMT}</CEPUnfairCompPBLMT>` : ''}
      ${submissionData.CEPWorksiteUnions ? `<CEPWorksiteUnions>${submissionData.CEPWorksiteUnions}</CEPWorksiteUnions>` : ''}
      ${submissionData.CEPDisputeExplanation ? `<CEPDisputeExplanation>${submissionData.CEPDisputeExplanation}</CEPDisputeExplanation>` : ''}
      <CEPOweGovt>${submissionData.CEPOweGovt}</CEPOweGovt>
      <CEPLiabilityInsurance>${submissionData.CEPLiabilityInsurance}</CEPLiabilityInsurance>
      <CEPExistingPolicy>${submissionData.CEPExistingPolicy}</CEPExistingPolicy>
      <CEPDisplacement>${submissionData.CEPDisplacement}</CEPDisplacement>
      <CEPEPBCDelivery>${submissionData.CEPEPBCDelivery}</CEPEPBCDelivery>
      <CEPOtherGovtFunding>${submissionData.CEPOtherGovtFunding}</CEPOtherGovtFunding>
      <CEPDisputeInProgress>${submissionData.CEPDisputeInProgress}</CEPDisputeInProgress>
      <CEPProjectDateRange/>
      ${submissionData.CEPObj_PBLMT_Objectives ? `<CEPObj_PBLMT_Objectives>${submissionData.CEPObj_PBLMT_Objectives}</CEPObj_PBLMT_Objectives>` : ''}
      ${submissionData.CEPObj_LMP_Objectives ? `<CEPObj_LMP_Objectives>${submissionData.CEPObj_LMP_Objectives}</CEPObj_LMP_Objectives>` : ''}
      <CEPProjectTitle>${submissionData.CEPProjectTitle}</CEPProjectTitle>
      <CEPProjectStartDate>${submissionData.CEPProjectStartDate}</CEPProjectStartDate>
      <CEPProjectEndDate>${submissionData.CEPProjectEndDate}</CEPProjectEndDate>
      ${submissionData.CEPHasParticipants ? `<CEPHasParticipants>${submissionData.CEPHasParticipants}</CEPHasParticipants>` : ''}
      ${submissionData.CEPParticipantCount ? `<CEPParticipantCount>${submissionData.CEPParticipantCount}</CEPParticipantCount>` : ''}
      ${submissionData.CEPAlternateLocations ? `<CEPAlternateLocations>${submissionData.CEPAlternateLocations}</CEPAlternateLocations>` : ''}
      ${submissionData.CEPTargetAboriginalCount ? `<CEPTargetAboriginalCount>${submissionData.CEPTargetAboriginalCount}</CEPTargetAboriginalCount>` : ''}
      ${submissionData.CEPTargetFrancophoneCount ? `<CEPTargetFrancophoneCount>${submissionData.CEPTargetFrancophoneCount}</CEPTargetFrancophoneCount>` : ''}
      ${submissionData.CEPTargetImmigrantCount ? `<CEPTargetImmigrantCount>${submissionData.CEPTargetImmigrantCount}</CEPTargetImmigrantCount>` : ''}
      ${submissionData.CEPTargetBarrieredCount ? `<CEPTargetBarrieredCount>${submissionData.CEPTargetBarrieredCount}</CEPTargetBarrieredCount>` : ''}
      ${submissionData.CEPTargetDisabilitiesCount ? `<CEPTargetDisabilitiesCount>${submissionData.CEPTargetDisabilitiesCount}</CEPTargetDisabilitiesCount>` : ''}
      ${submissionData.CEPTargetYouthCount ? `<CEPTargetYouthCount>${submissionData.CEPTargetYouthCount}</CEPTargetYouthCount>` : ''}
      ${
        submissionData.CEPTargetSurvivorsOfViolenceCount
          ? `<CEPTargetSurvivorsOfViolenceCount>${submissionData.CEPTargetSurvivorsOfViolenceCount}</CEPTargetSurvivorsOfViolenceCount>`
          : ''
      }
      ${submissionData.CEPTargetYouthAtRiskCount ? `<CEPTargetYouthAtRiskCount>${submissionData.CEPTargetYouthAtRiskCount}</CEPTargetYouthAtRiskCount>` : ''}
      ${submissionData.CEPTargetOtherCount ? `<CEPTargetOtherCount>${submissionData.CEPTargetOtherCount}</CEPTargetOtherCount>` : ''}
      ${submissionData.CEPTargetLayoffCount ? `<CEPTargetLayoffCount/>` : ''}
      <CATPartnerLetters/>
      ${submissionData.CEPExpectedResults_PBLMT ? `<CEPExpectedResults_PBLMT>${submissionData.CEPExpectedResults_PBLMT}</CEPExpectedResults_PBLMT>` : ''}
      ${submissionData.CEPPBLMTClassPercent ? `<CEPPBLMTClassPercent>${submissionData.CEPPBLMTClassPercent}</CEPPBLMTClassPercent>` : ''}
      ${submissionData.CEPPBLMTWorkPercent ? `<CEPPBLMTWorkPercent>${submissionData.CEPPBLMTWorkPercent}</CEPPBLMTWorkPercent>` : ''}
      ${submissionData.CEPJobDescriptions ? `<CEPJobDescriptions>${submissionData.CEPJobDescriptions}</CEPJobDescriptions>` : ''}
      ${submissionData.CEPObj_PBLMT_Sessions ? `<CEPObj_PBLMT_Sessions>${submissionData.CEPObj_PBLMT_Sessions}</CEPObj_PBLMT_Sessions>` : ''}
      ${submissionData.CEPObj_PBLMT_SessionCount ? `<CEPObj_PBLMT_SessionCount>${submissionData.CEPObj_PBLMT_SessionCount}</CEPObj_PBLMT_SessionCount>` : ''}
      ${
        submissionData.CEPObj_PBLMT_PartPerSessionCount
          ? `<CEPObj_PBLMT_PartPerSessionCount>${submissionData.CEPObj_PBLMT_PartPerSessionCount}</CEPObj_PBLMT_PartPerSessionCount>`
          : ''
      }
      ${submissionData.CEPObj_PBLMT_TrainingWeeks ? `<CEPObj_PBLMT_TrainingWeeks>${submissionData.CEPObj_PBLMT_TrainingWeeks}</CEPObj_PBLMT_TrainingWeeks>` : ''}
      ${submissionData.CEPObj_PBLMT_FollowupWeeks ? `<CEPObj_PBLMT_FollowupWeeks>${submissionData.CEPObj_PBLMT_FollowupWeeks}</CEPObj_PBLMT_FollowupWeeks>` : ''}
      ${submissionData.CEPObj_PBLMT_JobWeeks ? `<CEPObj_PBLMT_JobWeeks>${submissionData.CEPObj_PBLMT_JobWeeks}</CEPObj_PBLMT_JobWeeks>` : ''}
      ${submissionData.CEPTaxRebate ? `<CEPTaxRebate>${submissionData.CEPTaxRebate}</CEPTaxRebate>` : ''}
      ${submissionData.CEPPBLMT_LabourMarket ? `<CEPPBLMT_LabourMarket>${submissionData.CEPPBLMT_LabourMarket}</CEPPBLMT_LabourMarket>` : ''}
      ${submissionData.CEPESC1 ? `<CEPESC1>${submissionData.CEPESC1}</CEPESC1>` : ''}
      ${submissionData.CEPESC2 ? `<CEPESC2>${submissionData.CEPESC2}</CEPESC2>` : ''}
      ${submissionData.CEPESC3 ? `<CEPESC3>${submissionData.CEPESC3}</CEPESC3>` : ''}
      ${submissionData.CEPESC4 ? `<CEPESC4>${submissionData.CEPESC4}</CEPESC4>` : ''}
      ${submissionData.CEPAttESC_Letters ? `<CEPAttESC_Letters/>` : ''}
      ${submissionData.CEPAttSupportLetters_PBLMT ? `<CEPAttSupportLetters_PBLMT/>` : ''}
      ${submissionData.CEPProgressExplanation ? `<CEPProgressExplanation>${submissionData.CEPProgressExplanation}</CEPProgressExplanation>` : ''}
      ${submissionData.CEPPTimelinesActivities_LMP ? `<CEPPTimelinesActivities_LMP>${submissionData.CEPPTimelinesActivities_LMP}</CEPPTimelinesActivities_LMP>` : ''}
      ${submissionData.CEPExpectedResults_LMP ? `<CEPExpectedResults_LMP>${submissionData.CEPExpectedResults_LMP}</CEPExpectedResults_LMP>` : ''}
      ${submissionData.CEPIPRights ? `<CEPIPRights>${submissionData.CEPIPRights}</CEPIPRights>` : ''}
      ${submissionData.CEPIPRightsExplanation ? `<CEPIPRightsExplanation>${submissionData.CEPIPRightsExplanation}</CEPIPRightsExplanation>` : ''}
      ${submissionData.CEPObj_LMP_CommBenefit ? `<CEPObj_LMP_CommBenefit>${submissionData.CEPObj_LMP_CommBenefit}</CEPObj_LMP_CommBenefit>` : ''}
      <CATBudget/>
      <CEPRequestedBudget>${submissionData.CEPRequestedBudget}</CEPRequestedBudget>
      <CATAdditionalDocs/>
      <ConsentCheckbox>${submissionData.ConsentCheckbox}</ConsentCheckbox>
    </Results>]]></tem:payload>
          </tem:ReceiveApplication>
        </soap:Body>
    </soap:Envelope>`;
    // console.log('Prepared XML: ', xml);
    return xml;
  }
}

const username = config.get('serviceClient.oes.cfms.username');
const password = config.get('serviceClient.oes.cfms.password');
const apiUrl = config.get('serviceClient.oes.cfms.apiUrl');

let cfmsService = new CFMSService({ username: username, password: password, apiUrl: apiUrl });
module.exports = cfmsService;
