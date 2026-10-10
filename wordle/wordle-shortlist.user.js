// ==UserScript==
// @name         Wordle Shortlist
// @namespace    https://greasyfork.org/en/users/594496-divided-by
// @author       dividedby
// @description  NYT Wordle with a nudge: a random starting word, then a shortlist of possible answers to choose from each turn, so you still make the call
// @version      0.1.0
// @license      GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @homepageURL  https://github.com/dividedby/games-scripts
// @supportURL   https://github.com/dividedby/games-scripts/issues
// @match        https://www.nytimes.com/games/wordle*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/dividedby/games-scripts/main/wordle/wordle-shortlist.user.js
// @updateURL    https://raw.githubusercontent.com/dividedby/games-scripts/main/wordle/wordle-shortlist.user.js
// ==/UserScript==

(() => {
  'use strict';

  const PICKS = 5;     // guesses offered each turn
  // Each level draws the picks at random from this many of the best possible answers, so
  // some picks are better than others; Hard draws from all of them and hides the hints.
  const LEVELS = {
    easy:   { name: 'Easy',   pool: 10,       hints: true },
    medium: { name: 'Medium', pool: 30,       hints: true },
    hard:   { name: 'Hard',   pool: Infinity, hints: false },
  };
  const LEVEL_ORDER = ['easy', 'medium', 'hard'];
  const KEEP_DAYS = 60;

  // ---------- words ----------
  // NYT WordleBot's guess list, with the likely answers in CAPITALS (answers without regular
  // past tenses, as curated by github.com/WordGamesBot/wordgamesbot.github.io).
  const WORDS = `
ABACKABASEABASHABATEABBEYABBOTabetsABHORABIDEabledABODEABOILABORTABOUTABOVEABUSEabutsABUZZABYSSached
achesACHOOacidsACINGACORNacresACRIDactedACTORACUTEADAGEADAPTaddedADDERADDLEADEPTADIEUADIOSADMINADMIT
ADOBEADOBOADOPTADOREADORNADULTAEGISaeonsAERIEAFFIXAFIREAFOOTAFOREAFOULafrosAFTERAGAINAGAPEAGATEAGAVE
AGENTAGILEAGINGAGITAAGLOWAGONYAGORAAGREEaguesAHEADAHOLDaidedAIDERaidesailedaimedAIOLIairedAISLEALARM
ALBUMALDERALERTALGAEALIASALIBIALIENALIGNALIKEALIVEALLAYALLEYALLOTALLOWALLOYaloesALOFTALOHAALONEALONG
ALOOFALOUDALPHAALTARALTERaltosalumsAMAROAMASSAMAZEAMBERAMBITAMBLEAMENDamensAMIGOAMINOAMISSAMITYAMONG
AMOURampedAMPLEAMPLYAMUCKAMUSEANCHOANGELANGERANGLEANGRYANGSTANIMAANIMEANISEANKLEANNALANNEXANNOYANNUL
ANODEANOLEantesANTICantisANTSYANVILAORTAAPACEAPARTAPHIDAPINGAPNEAAPPLEAPPLYAPRONapsesAPTLYaquasARBOR
arcedARDORareasARENAARGONARGOTARGUEariasARISEARMEDARMORAROMAAROSEARRAYARROWARSONARTSYASCOTashedASHEN
ashesASIDEaskedASKERASKEWASPENASPICASSAYassesASSETASTERASTIRATLASATOLLatomsATONEATRIAATTICAUDIOAUDIT
AUGERAUGHTAUGURauntsAUNTYAURALaurasautosAVAILAVASTaversAVERTAVIANAVOIDavowsAWAITAWAKEAWARDAWAREAWASH
awaysAWFULAWOKEaxelsAXIALAXINGAXIOMAXIONaxlesaxonsAZUREBABELbabesBABKAbacksBACONBADGEBADLYBAGELBAGGY
bailsbaitsBAKEDBAKERbakesBALDYbaledBALERbalesbalksBALKYballsbalmsBALMYBALSABANALbandsBANDYbanesbangs
BANJObanksbarbsbardsbaredBARERbaresbarfsBARGEbarksbarnsBARONBARREBASALbasedbasesBASICBASILBASINBASIS
basksBASTEBATCHbatedbatesBATHEbathsBATIKBATONBATTYBAWDYbawlsbayedBAYOUBEACHbeadsBEADYbeaksbeamsbeans
BEARDbearsBEASTbeatsBEAUTBEBOPbecksBEECHbeefsBEEFYbeepsbeersbeetsBEFITBEFOGBEGANBEGATBEGETBEGINBEGOT
BEGUNBEIGEBEINGBELAYBELCHBELIEBELLEbellsBELLYBELOWbeltsBENCHbendsBENDYBENTOBERETbergsbermsBERRYBERTH
BERYLBESETBESOTbestsbetasBETELBEVELBEZELBIBLEBICEPBIDDYbidedbidesBIDETBIGOTbikedBIKERbikesbilesBILGE
billsBILLYbindsBINGEBINGOBIOMEBIPEDBIPODBIRCHbirdsBIRTHBISONBITERbitesBITSYBITTYblabsBLACKBLADEblahs
BLAMEBLANDBLANKBLAREBLASEBLASTBLAZEBLEAKBLEATBLEEDBLEEPBLENDBLESSBLIMPBLINDBLINGBLINKblipsBLISSBLITZ
BLOATblobsBLOCKblocsblogsBLOKEBLONDBLOODBLOOMBLOOPblotsBLOWNblowsBLUERbluesBLUFFBLUNTBLURBblursBLURT
BLUSHBOARDboarsBOASTboatsBOBBYBOCCEbodedbodesBOFFOBOGEYBOGGYBOGIEBOGUSboilsBOINGboltsBOLUSbombsbonds
bonedBONERbonesBONEYBONGObongsbonksBONNYBONUSboobsBOOBYbooedbooksboomsboonsboorsBOOSTBOOTHbootsBOOTY
BOOZEBOOZYBORAXBOREDboresBORICBORNEBORONBOSOMBOSONBOSSYBOTCHBOUGHBOULEBOUNDboutsbowedBOWELBOWERbowls
boxedBOXERboxesbozosBRACEbragsBRAIDBRAINBRAKEBRANDbransBRASHBRASSbratsBRAVABRAVEBRAVOBRAWLBRAWNbrays
BREADBREAKBREAMBREEDbrewsBRIARBRIBEBRICKBRIDEBRIEFBRIERbrigsbrimsBRINEBRINGBRINKBRINYBRISKBROADBROIL
BROKEBRONCBROODBROOKBROOMBROTHBROWNbrowsBRUINBRUNTBRUSHBRUSKBRUTEbucksBUDDYBUDGEbuffsBUGGYBUGLEBUILD
BUILTbulbsBULGEBULGYbulksBULKYbullsBULLYbumpsBUMPYBUNCHbunksBUNNYbuntsbuoysburgsBURKABURLYburnsBURNT
burpsBURROburrsBURSABURSTbusedbusesBUSHYbusksbustsBUSTYBUTCHBUTTEbuttsBUXOMBUYERBUZZYBYLAWbytesBYWAY
CABALCABBYCABINCABLECACAOCACHECACTICADDYCADETCADGECADREcafescagedcagesCAGEYCAIRNcakedcakescallscalms
CALVECAMELCAMEOcampsCAMPYCANALCANDYcanedcanesCANNYCANOECANONCAPEDCAPERcapesCAPONcaposCAPRICAPUTCARAT
carbscardscaredCARERcaresCARETCARGOCARNYCAROBCAROLCAROMcarpsCARRYCARTEcartsCARVEcasedcasescasksCASTE
castsCATCHCATERCATTYCAULKCAUSEcavedcavesCAVILcawedCEASECEDARcededcedesCELEBCELLOcellscentschadsCHAFE
CHAFFCHAINCHAIRCHALKCHAMPCHANTCHAOSchapsCHARDCHARMcharsCHARTCHARYCHASECHASMchatsCHEAPCHEATCHECKCHEEK
CHEEPCHEERchefsCHEMOCHESSCHESTchewsCHEWYCHICKCHIDECHIEFCHILDCHILECHILICHILLCHIMECHIMPCHINACHINOchins
chipsCHIRPchitsCHIVECHOCKCHOIRCHOKECHOMPchopsCHORDCHORECHOSECHOUXchowsCHUCKchugsCHUMPchumsCHUNKCHURL
CHURNCHUTECIDERCIGARCILIACINCHCIRCAcitedcitesCIVETCIVICCIVILCLACKCLADECLAIMCLAMPclamsCLANGCLANKclans
clapsCLASHCLASPCLASSCLAVEclawsclaysCLEANCLEARCLEATclefsCLEFTCLERKCLICKCLIFFCLIMBCLIMECLINGCLINKclips
CLOAKCLOCKclodsclogsCLOMPCLONEclopsCLOSECLOTHclotsCLOUDCLOUTCLOVECLOWNclubsCLUCKcluedcluesCLUMPCLUNG
CLUNKCOACHcoalsCOASTCOATIcoatsCOBRAcocksCOCKYCOCOAcodascodedCODERcodesCODEXcoedscoifscoilscoinscolas
coldsCOLICCOLONCOLORcoltscomasCOMBOcombscomesCOMETCOMFYCOMICCOMMAcompsCONCHCONDOconedconesCONGACONIC
conkscooedcookscoolscoopscootsCOPAYcopedcopesCOPSECORALcordscoredCORERcoresCORGIcorksCORKYcornsCORNY
CORPScostsCOUCHCOUGHCOULDCOUNTCOUPEcoupsCOURTCOUTHCOVENCOVERcovesCOVETCOVEYcowedCOWERcowlscoxedCOYLY
crabsCRACKCRAFTcragsCRAMPcramsCRANECRANKcrapsCRASHCRASSCRATECRAVECRAWLCRAZECRAZYCREAKCREAMCREDOCREED
CREEKCREEPCREMACREMECREPECREPTCRESSCRESTcrewscribsCRICKCRIEDCRIERcriesCRIMECRIMPCRISPCROAKCROCKcrocs
CRONECRONYCROOKCROONcropsCROSSCROUPCROWDCROWNcrowsCRUDECRUELCRUETCRUMBCRUMPCRUSHCRUSTCRYPTCUBBYcubed
cubesCUBICCUBITcuffsCUINGcullscultsCUMINCUPIDcurbscurdscuredCURERcuresCURIACURIOcurlsCURLYCURRYCURSE
CURVECURVYCUSHYcuspsCUTERCUTIECUTUPCYBERCYCLECYNICcystsczarsDACHADADDYDAFFYDAILYDAIRYDAISYdalesDALLY
damesdamnsDANCEDANDYdareddaresdarksdarnsdartsdatedDATERdatesDATUMdaubsDAUNTdawnsdazeddazesdealsDEALT
deansdearsDEATHDEBARDEBITdebtsDEBUGDEBUTDECAFDECALDECAYdecksDECORDECOYDECRYdeedsdeemsdeepsDEFERDEFOG
DEIFYDEIGNDEISTDEITYDELAYdelisdellsDELTAdeltsDELVEDEMONdemosDEMURDENIMDENSEdentsDEPOTDEPTHDERBYdesks
DETERDETOXDEUCEDEVILdialsDIARYdicedDICERdicesDICEYdietsDIGITdikeddikesdillsDILLYdimesDIMLYdinedDINER
dinesDINGOdingsDINGYDINKYDIODEDIPPYDIRGEDIRTYDISCOdiscsDISHYdisksDITCHDITSYDITTODITTYDITZYDIVANdivas
divedDIVERdivesDIVOTDIVVYDIZZYdocksDODGEDODGYdodosdoersdoffsDOGGYDOGMADOILYDOINGdoleddolesdollsDOLLY
doltsDOMEDdomesDONORDONUTdoomsdoorsDOOZYdopedDOPERdopesDOPEYdorksDORKYdormsdoseddosesdoteddotesDOTTY
DOUBTDOUGHDOULADOUSEdovesDOWDYDOWELdownsDOWNYDOWRYDOWSEdoxesdozedDOZENDOZERdozesdrabsDRAFTdragsDRAIN
DRAKEDRAMAdramsDRANKDRAPEdratsDRAWLDRAWNdrawsDREADDREAMDRECKdregsDRESSdribsDRIEDDRIERdriesDRIFTDRILL
DRINKdripsDRIVEDROIDDROITDROLLDRONEDROOLDROOPdropsDROSSDROVEDROWNdrubsdrugsDRUIDdrumsDRUNKDRYERDRYLY
DUCATDUCHYducksDUCKYductsdudesduelsduetsdukeddukesdullsDULLYDUMMYdumpsDUMPYDUNCEdunesdunksdupeddupes
dusksDUSKYdustsDUSTYDUTCHDUVETDWARFDWEEBDWELLDWELTdyadsdyersDYINGEAGEREAGLEearedearlsEARLYearnsEARTH
easedEASELeasesEATENEATEReavesebbedEBONYEBOOKECLATEDEMAedgedEDGERedgesEDICTEDIFYeditsEDUCEEERIEegged
EGRETEIDEREIGHTEJECTEKINGELATEELBOWELDERELECTELEGYELFINELIDEELITEELOPEELUDEelvesEMAILEMBEDEMBEREMCEE
EMERYemirsemitsEMOJIEMOTEEMPTYENACTendedENDOWENEMAENEMYENJOYENNUIENSUEENTERENTRYENVOYepeesepicsEPOCH
EPOXYEQUALEQUIPERASEERECTERODEerredERRORERUPTESSAYessesESTERETHERETHICETHOSETHYLETUDEeurosEVADEevens
EVENTEVERTEVERYEVICTevilsEVOKEewersEXACTEXALTexamsEXCELexecsEXERTEXILEEXISTexitsEXPATEXPELexposEXTOL
EXTRAEXUDEEXULTEXURBEYINGFABLEfacedfacesFACETfactsfadedFADERfadesfailsFAINTfairsFAIRYFAITHfakedFAKER
fakesFAKIRfallsFALSEFAMEDFANCYfangsFARCEfaredfaresfarmsfartsfastsFATALfatedfatesFATTYFATWAFAULTFAUNA
favesFAVORfawnsfaxedfaxesfazedfazesfearsFEASTfeatsFECALFECESfeedsfeelsFEIGNFEINTFELLAfellsFELONfelts
FEMMEFEMURFENCEfendsFERALfernsFERRYfestsFETALFETCHfetedfetesFETIDFETUSfeudsFEVERFEWERfiatsFIBERFICUS
fiefsFIELDFIENDFIERYfifesFIFTHFIFTYFIGHTFILCHfiledFILERfilesFILETfillsFILLYfilmsFILMYFILTHFINALFINCH
findsfinedFINERfinesfinksfiredfiresfirmsFIRSTFIRTHFISHYfistsfivesfixedFIXERfixesFIZZYFJORDFLACKflags
FLAILFLAIRFLAKEflaksFLAKYFLAMEFLANKflansflapsFLAREFLASHFLASKflatsflawsflaysfleasFLECKfleesFLEETFLESH
FLICKfliedFLIERfliesFLINGFLINTflipsFLIRTflitsFLOATFLOCKfloesflogsFLOODFLOORflopsFLORAFLOSSFLOURFLOUT
FLOWNflowsFLOWYflubsfluesFLUFFFLUIDFLUKEFLUKYFLUMEFLUNGFLUNKFLUSHFLUTEFLYBYFLYERfoalsfoamsFOAMYFOCAL
FOCUSFOGEYFOGGYfoilsFOISTfoldsFOLICFOLIOfolksFOLKYFOLLYfontsfoodsfoolsfootsFORAYFORCEfordsforesFORGE
FORGOforksformsFORTEFORTHfortsFORTYFORUMfoulsFOUNDFOUNTfoursfowlsfoxesFOYERFRACKFRAILFRAMEFRANCFRANK
fratsFRAUDfraysFREAKFREEDFREERfreesFRESHfretsFRIARFRIEDfriesFRILLFRISEFRISKFRITZFRIZZFROCKfrogsFROND
FRONTFROSHFROSTFROTHFROWNFROZEFRUITFRUMPFRYERFUDGEFUDGYfuelsFUGALFUGUEFULLYfumedfumesfundsFUNGIFUNGO
funksFUNKYFUNNYFURORFURRYfusedfusesFUSSYFUSTYFUTONFUZZYGABBYGABLEGAFFEgagesGAILYgainsgaitsgalasgales
gallsgamedGAMERgamesGAMEYGAMMAGAMUTgangsgapedgapesgarbsgasesgaspsGASSYGATEDgatesGATORGAUDYGAUGEGAUNT
GAUZEGAUZYGAVELgawksGAWKYGAYERGAYLYgazedGAZERgazesgearsGECKOgeeksGEEKYGEESEgeldsgenesGENIEGENREgents
GENUSGEODEgermsGERMYGETUPGHOSTGHOULGIANTgibedgibesGIDDYgiftsgildsgillsGIMMEgimpsgirdsgirlsGIRLYGIRTH
gistsGIVENGIVERgivesGIZMOGLACEGLADEGLAMPGLANDGLAREGLASSGLAZEGLEAMGLEANglensGLIDEGLINTGLITZGLOAMGLOAT
GLOBEglobsglomsGLOOMGLOOPglopsGLORYGLOSSGLOVEglowsGLOWYgluedgluesGLUEYGLUTEglutsGLYPHGNARLGNASHgnats
gnawsGNOMEgoadsgoalsgoatsGODLYgoersGOFERGOINGgoldsGOLEMgolfsGOLLYGONADGONERgongsGONNAGONZOgoodsGOODY
GOOEYgoofsGOOFYgoonsGOOPYGOOSEgoredgoresGORGEGORSEgothsGOTTAGOUGEGOURDgownsgrabsGRACEGRADEgradsGRAFT
GRAILGRAINgramsGRANDGRANTGRAPEGRAPHGRASPGRASSGRATEGRAVEGRAVYgraysGRAZEGREATGREEDGREENGREETgreysgrids
GRIEFGRIFTGRILLGRIMEGRIMYGRINDgrinsGRIPEgripsGRISTgritsGROANGROINgroksGROOMGROPEGROSSGROUPGROUTGROVE
GROWLGROWNgrowsgrubsGRUELGRUFFGRUMPGRUNTGUANOGUARDGUAVAGUESSGUESTGUIDEGUILDGUILEGUILTGUISEGULAGGULCH
gulfsgullsGULLYgulpsGUMBOGUMMYGUNKYGUPPYgurusGUSHYGUSSYGUSTOgustsGUSTYGUTSYGUTTYgyrosHABIThacksHACKY
hadesHAIKUhailshairsHAIRYHALALhaleshallshaloshaltsHALVEHAMMYhandsHANDYhangsHANKYHAPPYHARDYHAREMhares
harksharmsharpsHARPYHARRYHARSHHASTEHASTYHATCHhatedHATERhateshaulsHAUNTHAUTEHAVENhavesHAVOChawkshazed
HAZELhazesheadsHEADYhealsheapsHEARDhearsHEARTHEATHheatsHEAVEHEAVYHEDGEheedsheelsHEFTYheirsHEISTHELIX
HELLOhellshelmshelpshempsHENCEHENNAherbsherdsHERONHERTZhewedhexedhexeshicksHIDERhideshighsHIJABhiked
HIKERhikeshillsHILLYhiltshindsHINGEHINKYhintsHIPPOHIPPYhiredHIRERhiresHISSYHITCHhivedhivesHOARDHOARY
HOBBYhoboshocksHOCUSHOISTHOKEYHOKUMholdsholedholesHOLEYHOLLYhomedHOMERhomesHOMEYhonedhonesHONEYhonks
HONORHOOCHhoodsHOODYHOOEYhoofshooksHOOKYhoopshootshopedhopesHOPPYHORDEhornsHORNYHORSEhosedhoseshosts
HOTELHOTLYHOUNDhoursHOUSEHOVELHOVERHOWDYhowlsHUBBYhuffsHUFFYHUGGYhulashulksHULKYhullsHUMANHUMIDHUMOR
HUMPHhumpsHUMUSHUNCHhunksHUNKYhuntshurlsHURRYhurtshusksHUSKYHUSSYHUTCHHYDRAHYDROHYENAHYMENhymnshyped
HYPERhypesiambsICIERICILYICINGiconsIDEALideasIDIOMIDIOTidledIDLERidlesidolsIDYLLIGLOOILIACIMAGEimams
imbedIMBUEIMPELIMPLYINANEINAPTINBOXINCELINCURINDEXINDIEINEPTINERTINFERINGOTinkedINLAYINLETINNERINPUT
INSETINTELINTERINTROINUREIONICIRATEirkedironsIRONYislesISLETISSUEITCHYitemsIVIEDiviesIVORYjacksJADED
jadesjailsjambsJAMMYJANKYJAUNTjawedJAZZYjeansjeepsjeersjellsJELLYjerksJERKYjestsJETTYJEWELjibedjibes
JIFFYjiltsJIMMYjocksjohnsjoinsJOINTJOISTjokedJOKERjokesJOKEYJOLLYjoltsJOULEJOUSTjowlsJOWLYJUDGEJUDGY
JUICEJUICYjukedjukesJULEPJUMBOjumpsJUMPYjunksJUNKYJUNTAJUNTOJURORKABOBkalesKAPPAKAPUTKARATKARMAkarts
KAYAKKAZOOKEBABkeelskeepsKEFIRkelpsKEMPTkeyedKHAKIkicksKIDDOkillskilnskiloskiltsKINDAkindskingskinks
KINKYKIOSKKISSYkitesKITTYkiwisKLUTZKNACKKNAVEKNEADkneedKNEELkneesKNELLKNELTKNIFEKNISHknitsknobsKNOCK
KNOLLknotsKNOWNknowsKOALAkoanskooksKOOKYKORANKRILLKRONEKUDOSKUDZUKUGELKVELLLABELLABORlacedlacesLACEY
lacksLADENLADLELAGERlairsLAITYlakeslamaslambslamedLAMERlampsLANCElandslanesLANKYLAPELLAPSELARCHlards
LARGElarksLARVALASERLASSOlastsLATCHLATERLATEXLATHELATKELATTElaudsLAUGHlavaslavedlawnsLAYERLAYUPlazed
lazesLEACHleadsleafsLEAFYleaksLEAKYleansLEANTleapsLEAPTLEARNLEASELEASHLEASTLEAVEledesLEDGELEECHleeks
leersLEERYleftsLEFTYLEGALLEGGYLEGITLEMMALEMONLEMURlendsLEPERLETUPLEVEELEVELLEVERLEXISliarsLIBELLICIT
licksLIEGEliensLIFERliftsLIGHTlikedLIKENlikesLILACLIMBOlimbslimesLIMITlimnslimoslimpslinedLINENLINER
linesLINGOlinkslionsLIPIDLIPPYliraslispslistsLITERLITHELITRElivedLIVENLIVERlivesLIVIDLLAMAloadsloafs
loamsLOAMYloansLOATHLOBBYlobedlobesLOCALlochslocksLOCUSlodesLODGELOESSloftsLOFTYlogesLOGICLOGINLOGON
logosloinslollsLOLLYLONERlongslooksloomsloonsLOONYloopsLOOPYLOOSElootslopedlopeslordsLORDYloresLORIS
LORRYLOSERlosesLOTTOLOTUSLOUPELOUSELOUSYloutslovedLOVERlovesLOWERLOWLYLOYALlubedlubesLUCIDLUCKYLUCRE
LUGERlugeslullsLUMENlumpsLUMPYLUNARLUNCHLUNGElungsLUPUSLURCHluredluresLURIDlurkslustsLUSTYlutedlutes
LYINGLYMPHLYRICMACAWmacesMACHOMACROMADAMMADLYMAFIAMAGICMAGMAmagusmaidsmailsmaimsmainsMAIZEMAJORMAKER
makesmalesMALICmallsmaltsMALTYMAMBAMAMBOMAMMAmanesMANGAMANGEMANGOMANGYMANIAMANICMANLYMANNAMANORMANSE
MAPLEMARCHmaresmarksMARRYMARSHmartsmasksMASONMASSEmastsMATCHmatedmatesMATEYmathsMATTEMATZOmaulsMAUVE
MAVENmaxedmaxesMAXIMMAYBEMAYORmazesmealsMEALYmeansMEANTmeatsMEATYMECCAMEDALMEDIAMEDICmeetsmeldsMELEE
MELONmeltsMELTYmemesmemosmendsmenusmeowsMERCHMERCYMERGEMERITMERRYmesasMESHYMESSYMETALmetedMETERmetes
METREMETROmewedmewlsMEZZOMICROMIDGEMIDSTMIGHTmikedmikesMILERmilesmilksMILKYmillsmimedmimesMIMICMINCE
mindsminedMINERminesMINIMminisminksMINORmintsMINTYMINUSmiredmiresMIRINMIRTHMISERMISSYmistsMISTYMITER
mitesmittsmixedMIXERmixesMIXUPmoansmoatsMOCHAMOCHImocksMODALMODELMODEMmodesMODUSMOGULMOISTMOLARmolds
MOLDYmolesMOLLYmoltsMOMMAMOMMYMONEYmonksMONTHMOOCHmoodsMOODYmooedmoonsMOONYmoorsMOOSEmootsMOPEDMOPER
mopesMOPEYMORALMORAYMORELmoresmornsMORONMORPHMOSEYMOSSYMOTELmotesmothsMOTIFMOTORMOTTOMOULDMOULTMOUND
MOUNTMOURNMOUSEMOUSYMOUTHmovedMOVERmovesMOVIEmowedMOWERMOXIEmucksMUCKYMUCUSMUDDYmuffsMUGGYMULCHmules
mullsMUMMYmumpsMUNCHmuonsMURALMURKYmusedmusesMUSHYMUSICmusksMUSKYmustsMUSTYmutedmutesmuttsMYRRHmyths
NABOBNACHONADIRNAGGYnaifsnailsNAIVENAKEDnamednamesNANNYNAPPYnarcsNASALNASTYNATALNATTYNAVALNAVELnaves
nearsnecksneedsNEEDYNEIGHneonsnerdsNERDYNERVENERVYnestsNEVERNEWERNEWLYNEWSYnewtsnextsNEXUSNICERNICHE
nicksNIECENIFTYNIGHTninesNINJANINNYNINTHNIPPYNITROnixednixesNOBLENOBLYNODALnodesnoirsNOISENOISYNOMAD
nooksnoonsNOOSEnormsNORTHnosednosesNOSEYNOTCHnotednotesnounsNOVELnudesNUDGEnukednukesnullsnumbsNURSE
NUTSONUTTYNYLONNYMPHOAKENoaredoasesOASISoathsOBESEobeysobitsoboesOCCUROCEANOCHEROCHREOCTALOCTETODDER
ODDLYodorsOFFALoffedOFFEROFTENogledOGLERoglesogresoiledOILERoinksOKAPIokaysOLDENOLDEROLDIEOLIVEOMBRE
OMEGAomensomitsONIONONSETOOMPHoozedoozesopalsopensOPERAOPINEOPIUMoptedOPTICoralsORATEorbedORBITorcas
ORDERORGANOTHEROTTEROUGHTOUIJAOUNCEoustsOUTDOoutedOUTEROUTGOOUTREovalsOVARYOVATEovensoversOVERTOVINE
OVOIDOWINGownedOWNEROXBOWOXIDEOZONEpacedPACERpacespackspactsPADDYPADREPAEANPAGANpagedPAGERpagespails
painsPAINTpairspaledPALERpalespallspalmsPALSYPANDAPANELpanespangsPANICPANKOPANSYpantsPANTYPAPALPAPER
PARCHparedPARERparesPARKAparksPARRYPARSEpartsPARTYPASSEPASTAPASTEpastsPASTYPATCHpatespathsPATIOPATSY
PATTYPAUSEpavedPAVERpavespawedpawnsPAYEEPAYERPEACEPEACHpeakspealsPEARLpearspeatsPEATYPECANpecksPEDAL
peekspeelspeepspeersPEEVEpeltsPENALPENCEPENNEPENNYpeonsPEONYPEPPYPERCHPERILperksPERKYpermsperpsPESKY
pesosPESTOpestsPETALPETERPETITPETRIPETTYPHAGEPHASEPHISHPHONEPHONYPHOTOPIANOpicaspicksPICKYPIECEpiers
PIETYPIGGYpikedPIKERpikesPILAFpiledpilespillsPILOTpimpsPINCHpinedpinesPINEYpingspinksPINKYPINOTPINTO
pintsPINUPPIOUSpipedPIPERpipesPIPETPIQUEPISTEpitasPITCHPITHYPIVOTPIXELPIXIEPIZZAPLACEPLAIDPLAINPLAIT
PLANEPLANKplansPLANTPLASMPLATEPLAYAplaysPLAZAPLEADpleasPLEATPLEBEplebspliedPLIERpliesPLINKplodsPLONK
plopsplotsplowsploysPLUCKplugsPLUMBPLUMEPLUMPplumsPLUNKPLUSHPOACHpoemsPOESYpoetsPOINTPOISEpokedPOKER
pokesPOKEYPOLARpoledpolesPOLIOPOLISPOLKApollspolosPOLYPpondsPOOCHPOOFYpoolspoopspopesPOPPYPOPUPPORCH
poredporesPORGYPORKYportsposedPOSERposesPOSITPOSSEpostsPOTTYPOUCHPOUNDpourspoutsPOUTYPOWERpramsPRANK
PRATEPRAWNpraysPREENprepsPRESSpreysPRICEPRICKPRICYPRIDEPRIEDpriesprigsPRIMAPRIMEPRIMOPRIMPPRINTPRION
PRIORPRISEPRISMPRIVYPRIZEPROBEprodsPROLEPROMOpromsPRONEPRONGPROOFpropsPROSEPROUDPROVEPROWLprowsPROXY
PRUDEPRUNEPSALMPSHAWPSYCHPUBICpucksPUDGEPUDGYpuffsPUFFYpukedpukespullspulpsPULPYPULSEpumaspumpsPUNCH
punksPUNKYPUNNYpuntsPUPAEPUPILPUPPYPUREEPURERPURGEpurrsPURSEPUSHYputtsPUTTYPYGMYPYLONQUACKquadsQUAFF
QUAILQUAKEQUALMQUANTQUARKQUARTQUASHQUASIquaysQUEENQUEERQUELLQUERYQUESOQUESTQUEUEQUICKQUIETQUILLQUILT
quipsQUIRKQUITEquitsQUOTAQUOTEQUOTHQURANRABBIRABIDracedRACERracesracksRADARRADIIRADIORADONraftsraged
RAGERragesraidsrailsrainsRAINYRAISERAJAHrajasrakedrakesRALLYRALPHRAMENrampsRANCHRANDYRANGERANGYranks
rantsRAPIDRARERraspsRASPYratedRATERratesRATIORATTYravedRAVELRAVENRAVERravesRAYONrazedrazesRAZORREACH
REACTreadsREADYREALMreamsreapsREARMrearsREBARREBELREBIDREBUSREBUTREBUYRECAPRECONRECURRECUTREDIDREDUB
REDUXreedsREEDYreefsreeksreelsREFERREFITREFRYREGALREHABREIFYREIGNREIKIreinsRELAXRELAYRELICRELITREMAP
REMITREMIXRENALrendsRENEWrentsREPAYREPELREPLYreposREPOTRERANRERUNRESAWRESETRESINrestsRETAGRETCHRETIE
RETRORETRYREUSEREVELREVUERHEUMRHINORHYMEricesRICINRIDERridesRIDGEriffsRIFLEriftsRIGHTRIGIDRIGORriled
rilesrillsrindsringsrinksRINSEriotsRIPENRIPERRISENRISERrisesrisksRISKYritesRITZYRIVALRIVENRIVERRIVET
ROACHroadsroamsroansroarsROASTrobedrobesROBINROBOTrocksROCKYRODEOROGERROGUEroilsrolesrollsROMANromps
roofsrooksroomsROOMYROOSTrootsropedROPERropesrosesROSINROTORROUGEROUGHROUNDROUSEROUSTROUTEroutsroved
ROVERROWDYrowedROWERROYALrubesRUBLERUDDYRUDERRUGBYRUINGruinsruledRULERrulesRUMBARUMMYRUMORrumpsrungs
RUNNYruntsRUNUPRUPEERURALrusesrustsRUSTYSABERSABLESABREsacksSADLYSAFERsafessagassagesSAGGYsailsSAINT
sakesSALADsalesSALLYSALONSALSAsaltsSALTYSALVESALVOSAMBASAMEYsandsSANDYSANERSAPPYSASSYSATAYsatedsates
SATINSATYRSAUCESAUCYSAUNASAUTEsavedSAVERsavesSAVORSAVOYSAVVYsawedsaxesscabsscadsSCALDSCALESCALPSCALY
SCAMPscamsscansSCANTSCAPESCARESCARFSCARPscarsSCARYscatsSCENESCENTSCHWASCIONSCOFFSCOLDSCONESCOOPSCOOT
SCOPESCORESCORNSCOURSCOUTSCOWLscowsSCRAMSCRAPSCREESCREWSCRIMSCRIPSCRODSCRUBSCRUMSCUBASCUFFSCULLseals
seamsSEAMYsearsseatssectsSEDANSEDERSEDGEseedsSEEDYseeksseemsseepsseersSEGUESEIZEselfssellssemissends
SENSESEPIAserfsSERIFSERUMSERVESETUPSEVENSEVERsewedSEWERsexessextsSHACKSHADESHADYSHAFTshahsSHAKESHAKY
SHALESHALLSHALTSHAMEshamsSHANKSHAPESHARDSHARESHARKSHARPSHAVESHAWLSHEAFSHEARshedsSHEENSHEEPSHEERSHEET
SHEIKSHELFSHELLSHIEDshiesSHIFTSHILLshimsSHINEshinsSHINYshipsSHIRESHIRKSHIRTSHIVAshivsSHLEPSHOALSHOCK
shoedshoesSHONESHOOKshoosSHOOTshopsSHORESHORNSHORTshotsSHOUTSHOVESHOWNshowsSHOWYSHREDSHREWSHRUBSHRUG
SHUCKshunsSHUNTSHUSHshutsSHYERSHYLYsidedsidesSIDLESIEGESIEVEsiftssighsSIGHTSIGMAsignssilksSILKYsills
SILLYsilosSILTYsimpsSINCEsinesSINEWSINGEsingssinksSINUSsiredSIRENsiresSISSYSITARsitedsitesSITUPsixes
SIXTHSIXTYsizedsizesSKATEskedsSKEETSKEINskewsskidsskiedSKIERskiesSKIFFSKILLSKIMPskimsskinsskipsSKIRT
skitsskuasSKULKSKULLSKUNKslabsSLACKslagsSLAINSLAKEslamsSLANGSLANTslapsSLASHSLATEslatsslayssledsSLEEK
SLEEPSLEETSLEPTSLICESLICKSLIDESLIMEslimsSLIMYSLINGSLINKslipsslitsslobssloesslogsSLOOPSLOPEslopsSLOSH
SLOTHslotsslowsslugsSLUMPslumsSLUNGSLUNKSLURPslursSLUSHSLYLYSMACKSMALLSMARMSMARTSMASHSMEARSMELLSMELT
SMILESMIRKSMITESMITHSMOCKSMOKESMOKYSMOTESMUSHSNACKSNAFUsnagsSNAILSNAKESNAKYsnapsSNARESNARFSNARKSNARL
SNEAKSNEERSNIDESNIFFSNIPEsnipssnitssnobsSNOOPSNOOTSNORESNORTSNOUTsnowsSNOWYsnubsSNUCKSNUFFsoakssoaps
SOAPYsoarsSOBERsockssodassofasSOFTYSOGGYsoilsSOLARsoledsolesSOLIDsolosSOLVESONARsongsSONICSOOTHSOOTY
SOPPYsoresSORRYsortssoulsSOUNDsoupsSOUPYsoursSOUTHsowedSOWERSPACESPADEspamsSPANKspansSPARESPARKspars
SPASMSPATEspatsSPAWNspaysSPEAKSPEARSPECKspecsSPEEDSPELLSPELTSPENDSPENTSPERMspewsSPICESPICYSPIEDSPIEL
spiesSPIFFSPIKESPIKYSPILLSPILTSPINEspinsSPINYSPIRESPITEspitsSPLATSPLAYSPLITSPOILSPOKESPOOFSPOOKSPOOL
SPOONSPORESPORKSPORTspotsSPOUTSPRAYSPREESPRIGspudsSPUMESPUNKSPURNspursSPURTSQUABSQUADSQUATSQUIBSQUID
stabsSTACKSTAFFSTAGEstagsSTAGYSTAIDSTAINSTAIRSTAKESTALESTALKSTALLSTAMPSTANDSTANKSTAPHSTARESTARKstars
STARTSTASHSTATEstatsSTAVEstaysSTEADSTEAKSTEALSTEAMSTEEDSTEELSTEEPSTEERSTEINSTELEstemsSTENOSTENTsteps
STERNstewsSTICKstiesSTIFFSTILESTILLSTILTSTINGSTINKSTINTstirsSTOCKSTOICSTOKESTOLESTOMASTOMPSTONESTONY
STOODSTOOLSTOOPstopsSTORESTORKSTORMSTORYSTOUTSTOVEstowsSTRAPSTRAWSTRAYSTREPSTREWSTRIPSTRUMSTRUTstubs
STUCKstudsSTUDYSTUFFSTUMPSTUNGSTUNKstunsSTUNTSTYLESUAVEsucksSUDSYSUEDESUGARSUINGSUITEsuitssulksSULKY
SULLYSUMACsumossumpsSUNNYSUNUPSUPERSURERsurfsSURGESURLYSUSHIswabsSWAINSWALESWAMISWAMPSWANGSWANKswans
swapsSWARMSWASHSWATHswatsswaysSWEARSWEATSWEEPSWEETSWELLSWEPTSWIFTswigsSWILLswimsSWINESWINGSWIPESWIRL
SWISHSWOONSWOOPSWORDSWORESWORNSWUNGSYNCHsyncsSYNODSYNTHSYRUPTABBYTABLETABOOTACITtacksTACKYtacosTAFFY
tailsTAINTTAKENTAKERtakestalestalksTALKYTALLYTALONTALUStamedTAMERtamestampsTANGOTANGYtankstapastaped
TAPERtapesTAPIRTARDYTAROTtarpsTARRYtartstasedTASERtasestasksTASTETASTYTATERTATTYTAUNTTAUPETAWNYtaxed
taxestaxisTEACHteamstearsTEARYTEASEteatstechsTECHYTEDDYteemsteensTEENYTEETHtellsTELOSTEMPOtempsTEMPT
tendsTENETTENORTENSETENTHtentsTEPEETEPIDtermsternsTERRATERRYTERSEtestsTESTYTETRAtextsTHANKthawsTHEFT
THEIRTHEMETHERETHESETHETATHICKTHIEFTHIGHTHINETHINGTHINKthinsTHIRDTHONGTHORNTHOSETHREETHREWTHROBTHROW
THRUMthudsthugsTHUMBTHUMPTHYMETIARATIBIAticksTIDALtidedtidestierstiffsTIGERTIGHTTILDEtiledtilestills
tiltstimedTIMERtimesTIMIDtinesTINGEtingsTINNYtintsTIPSYTIREDtiresTITANTITERTITHETITLETIZZYtoadsTOADY
TOASTTODAYTODDYtogastoilsTOKENtokestollstombstomesTONALtonedTONERtonesTONEYTONGAtongsTONICtoolsTOOTH
tootsTOPAZTOPICTORAHTORCHTORSOTORTATORTEtortsTORUSTOTALtotedTOTEMtotesTOUCHTOUGHtourstoutstowedTOWEL
TOWERtownsTOXICTOXINtoyedTRACETRACKTRACTTRADETRAILTRAINTRAITTRAMPtramsTRANStrapsTRASHTRAWLtraysTREAD
TREATtreedtreestreksTRENDTRESStreysTRIADTRIALTRIBETRICETRICKTRIEDTRIERtriesTRIKETRILLtrimstriosTRIPE
tripsTRITETROLLTROMPTROOPTROPEtrotsTROUTTROVETRUCETRUCKTRUERTRULYTRUMPTRUNKTRUSSTRUSTTRUTHTRYSTtsars
TUBALtubasTUBBYtubedTUBERtubestuckstuftsTUFTYTULIPTULLETUMMYTUMORtunastunedTUNERtunesTUNICTURBOturds
turfsturksturnstusksTUTORtutustuxesTWAINTWANGTWEAKTWEEDTWEENTWEETTWERKTWERPTWICEtwigsTWILLTWINEtwins
TWIRLTWISTtwitsTWIXTTYINGtykestypedtypestypostyrosUDDERULCERULNARULTRAUMAMIUMBERUMBRAUNARMUNBOXUNCAP
UNCLEUNCUTUNDERUNDIDUNDUEUNFEDUNFITUNHIPUNIFYUNIONUNITEunitsUNITYUNJAMUNLITUNMETUNPINUNSAYUNSEEUNSET
UNTAGUNTIEUNTILUNWEDUNZIPUPENDuppedUPPERUPSETURBANurgedurgesURINEUSAGEusersUSHERUSINGUSUALUSURPUSURY
UTILEUTTERUVULAVAGUEvalesVALETVALIDVALORVALUEVALVEvampsVAMPYvanesvapedvapesVAPIDVAPORvasesVAULTVAUNT
veepsveersVEGANveilsveinsVEINYVELDTVENALvendsVENOMVENTIventsVENUEverbsVERGEVERSEVERSOvertsVERVEvests
vexedvexesvialsvibesVICARvicesVIDEOviewsVIGILVIGORVILLAvinedvinesVINYLVIOLAVIPERVIRALVIRUSvisasvises
VISITVISORVISTAVITALVITROVIVIDVIXENvlogsVOCALVODKAVOGUEVOICEvoidsVOILAVOILEvolesvoltsVOMITvotedVOTER
votesVOUCHvowedVOWELVROOMVYINGWACKOWACKYwadedWADERwadesWAFERwaftswagedWAGERwagesWAGONwaifswailsWAIST
waitsWAIVEwakedWAKENwakeswalkswallsWALTZwandswanedwanesWANLYwantswardswareswarmswarnswarpswartsWARTY
waspsWASTEWATCHWATERwattswavedWAVERwaveswaxedWAXENwaxesweanswearsWEARYWEAVEWEDGEweedsWEEDYweeksweeps
WEEPYWEIGHWEIRDweirsweldswellsweltswendsWHACKWHALEWHARFWHEATWHEELWHELKWHELPWHEREwhetsWHICHWHIFFWHILE
whimsWHINEWHINYwhipsWHIRLWHIRRwhirsWHISKWHISTWHITEWHIZZWHOLEWHOMPWHOOPWHORLWHOSEwicksWIDENWIDERWIDOW
WIDTHWIELDWIGHTwikiswildswiledwileswillsWILLYwiltswimpsWIMPYWINCEWINCHwindsWINDYwinedwinesWINEYwings
winkswinoswipedWIPERwipeswiredwiresWISERwispsWISPYWITCHWITTYwivesWOKENwolfsWOMANwombsWOMENwonksWONKY
woodsWOODYwooedWOOERwoofswoolsWOOLYWOOZYwordsWORDYworksWORLDwormsWORMYWORRYWORSEWORSTWORTHWOULDWOUND
WOVENwowedWRACKwrapsWRATHWREAKWRECKwrensWRESTWRINGWRISTWRITEwritsWRONGWROTEWRUNGWRYLYWURSTXENONYACHT
YAHOOyanksYAPPYyardsyarnsyawlsyawnsyawpsyeahsYEARNyearsYEASTyellsyelpsyesesYIELDyikesYODELyogisyoked
YOKELyokesyolksYOUNGyoursYOUTHyowlsYUCCAyucksYUCKYYUMMYyurtsZEBRAzerosZESTYZILCHzineszingsZIPPYZONAL
zonedzoneszooms
`.replace(/\s+/g, '');
  const ALL = [];       // every word we may suggest, lowercase
  const ANSWER = [];    // ANSWER[i]: ALL[i] is a likely answer
  for (let i = 0; i < WORDS.length; i += 5) {
    const w = WORDS.slice(i, i + 5);
    ALL.push(w.toLowerCase());
    ANSWER.push(w !== w.toLowerCase());
  }
  const codes = w => Uint8Array.from(w, c => c.charCodeAt(0) - 97);
  const CODES = ALL.map(codes);
  const ANSWERS = ALL.map((_, i) => i).filter(i => ANSWER[i]);

  // ---------- scoring ----------
  // The colors a guess would get against an answer, as a number: each letter is
  // 0 gray, 1 yellow, 2 green, position i worth 3^i. All green is 242.
  const GREEN_ALL = 242;
  const spare = new Int8Array(26); // answer letters not matched green
  const res = new Int8Array(5);
  // With repeated letters, only as many copies turn yellow as the answer has spare, leftmost first
  function pattern(g, a) {
    for (let i = 0; i < 5; i++) {
      if (g[i] === a[i]) res[i] = 2; else { res[i] = 0; spare[a[i]]++; }
    }
    for (let i = 0; i < 5; i++) {
      if (res[i] !== 2 && spare[g[i]] > 0) { res[i] = 1; spare[g[i]]--; }
    }
    let p = 0;
    for (let i = 4; i >= 0; i--) p = p * 3 + res[i];
    for (let i = 0; i < 5; i++) spare[a[i]] = 0;
    return p;
  }
  const STATE = { absent: 0, present: 1, correct: 2 };
  const toPattern = states => states.reduceRight((p, s) => p * 3 + STATE[s], 0);

  // rows: [{ word, states: ['correct'|'present'|'absent' ×5] }]
  function candidates(rows, pool) {
    const done = rows.map(r => ({ g: codes(r.word), p: toPattern(r.states) }));
    return pool.filter(i => done.every(r => pattern(r.g, CODES[i]) === r.p));
  }

  // Expected number of answers still possible after guessing g (0 when g is the only one left)
  const buckets = new Int32Array(243);
  const seen = new Int16Array(243); // the patterns hit, so only those get cleared
  function expectedLeft(g, cands) {
    const touched = seen; let n = 0;
    for (const a of cands) {
      const p = pattern(g, CODES[a]);
      if (buckets[p]++ === 0) touched[n++] = p;
    }
    let sum = 0;
    for (let k = 0; k < n; k++) { const p = touched[k]; if (p !== GREEN_ALL) sum += buckets[p] * buckets[p]; buckets[p] = 0; }
    return sum / cands.length;
  }

  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Returns { left: number of answers still possible, picks: [{ word, left }] }.
  // Every pick could be the answer (no "filler" words that only narrow things down),
  // so they follow hard mode's rules on their own.
  function choose(rows, pool = LEVELS.medium.pool) {
    if (!rows.length) { // truly random, not a good starter: any likely answer
      const i = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
      return { left: ANSWERS.length, picks: [{ word: ALL[i], left: expectedLeft(CODES[i], ANSWERS) }] };
    }
    let cands = candidates(rows, ANSWERS);
    if (!cands.length) cands = candidates(rows, ALL.map((_, i) => i)); // the answer isn't on our list
    const scored = cands.map(i => ({ word: ALL[i], left: expectedLeft(CODES[i], cands) }))
      .sort((x, y) => x.left - y.left); // fewer answers left after it first
    const picks = scored.length <= PICKS ? scored : shuffle(scored.slice(0, pool)).slice(0, PICKS).sort((x, y) => x.left - y.left);
    return { left: cands.length, picks };
  }

  // ---------- storage ----------
  const ls = {
    get(k, fallback) { try { const v = localStorage.getItem(k); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  // Today's puzzle has no date in its URL, so it's filed under the day the page was opened
  const openedOn = new Date().toLocaleDateString('en-CA');
  const puzzleId = () => location.pathname.match(/\d{4}-\d{2}-\d{2}/)?.[0] || openedOn;
  const picksKey = () => 'wsl:' + puzzleId();
  const COLLAPSED_KEY = 'wsl:collapsed';
  const LEVEL_KEY = 'wsl:level';

  function tidy() {
    const cutoff = Date.now() - KEEP_DAYS * 864e5;
    try {
      for (const k of Object.keys(localStorage)) {
        const d = k.match(/^wsl:(\d{4}-\d{2}-\d{2})$/)?.[1];
        if (d && ls.get(k, {}).at < cutoff) ls.del(k);
      }
    } catch {}
  }

  // ---------- the board ----------
  const tiles = () => [...document.querySelectorAll('[data-testid="tile"]')];
  function readBoard() {
    const t = tiles();
    const rows = [];
    let typed = 0;
    for (let r = 0; r * 5 < t.length; r++) {
      const row = t.slice(r * 5, r * 5 + 5);
      const states = row.map(x => x.dataset.state);
      if (states.every(s => s in STATE)) rows.push({ word: row.map(x => x.textContent.trim().toLowerCase()).join(''), states });
      else { typed = states.filter(s => s === 'tbd').length; break; }
    }
    const won = rows.some(r => r.states.every(s => s === 'correct'));
    return { rows, typed, ready: t.length >= 30, won, over: won || rows.length >= 6 };
  }
  const key = k => document.querySelector(`[data-key="${k}"]`);
  const keyboard = () => key('↵')?.closest('[class*="Keyboard-module_keyboard"]') || key('↵')?.parentElement?.parentElement;

  // ---------- panel ----------
  const host = document.createElement('div');
  host.id = 'wsl-root';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    /* padding goes on #wsl: the page's own CSS overrides any padding set on :host */
    :host { display: block; width: 100%; max-width: 500px; margin: 0 auto; box-sizing: border-box; }
    #wsl { display: flex; flex-direction: column; gap: 4px; margin: 4px 0 8px; padding: 0 8px; font-family: inherit; }
    .row { display: flex; align-items: stretch; justify-content: center; gap: 6px; }
    .info { text-align: center; font-size: 12px; opacity: .7; line-height: 18px; }
    .info button { padding: 0 6px; font-size: 12px; line-height: 16px; }
    #wsl[hidden] { display: none; }
    .lead { align-self: center; font-size: 13px; opacity: .7; white-space: nowrap; }
    button { font: inherit; color: inherit; background: transparent; cursor: pointer; border-radius: 6px;
      border: 1px solid color-mix(in srgb, currentColor 30%, transparent); padding: 4px 2px; touch-action: manipulation; }
    button:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
    button:disabled { opacity: .45; cursor: default; }
    .pick { flex: 1 1 0; min-width: 0; max-width: 92px; display: flex; flex-direction: column; align-items: center; gap: 1px; }
    .pick b { font-size: 15px; letter-spacing: .04em; text-transform: uppercase; }
    .pick small { font-size: 11px; opacity: .75; white-space: nowrap; }
    .tools { flex: 0 0 auto; display: flex; gap: 6px; }
    .tool { width: 34px; font-size: 16px; }
    /* phones: room at the screen edges, a bit more than the keyboard has, and slimmer
       tools so the five words keep their width */
    @media (max-width: 480px) {
      #wsl { padding: 0 12px; }
      .row { gap: 4px; }
      .tools { gap: 4px; }
      .pick b { font-size: 14px; letter-spacing: 0; }
      .tool { width: 30px; padding: 0; }
      .info button { padding: 2px 10px; line-height: 18px; } /* big enough to tap */
    }
    #show { margin: 6px auto 8px; display: block; padding: 4px 10px; font-size: 13px; }
    #show[hidden] { display: none; }
    .note { align-self: center; font-size: 13px; opacity: .75; }
  </style>
  <div id="wsl" hidden></div>
  <button id="show" hidden title="Show the shortlist">🎲 Shortlist</button>`;
  const panel = root.getElementById('wsl');
  const show = root.getElementById('show');

  // state: what's saved for this puzzle: { sig, left, picks, level, turns, at }.
  // turns: one entry per guess made with a choice of picks: { used, best } (played a pick,
  // and was it one of the best on offer)
  let state = null;
  let busy = false;   // typing a pick in
  let collapsed = ls.get(COLLAPSED_KEY, false);
  let level = LEVELS[ls.get(LEVEL_KEY, 'medium')] ? ls.get(LEVEL_KEY, 'medium') : 'medium';

  const leftText = n => n < 1.5 ? '~1 left' : `~${Math.round(n)} left`;
  const sigOf = rows => rows.map(r => r.word + ':' + toPattern(r.states)).join(',');
  const plural = (n, w) => `${n.toLocaleString()} ${w}${n === 1 ? '' : 's'}`;

  function recap(board) {
    const turns = state.turns || [];
    const best = turns.filter(t => t.best).length;
    return [board.won ? `Solved in ${board.rows.length}` : 'Out of guesses',
      turns.length ? `best pick ${best} of ${turns.length}` : '',
      LEVELS[LEVEL_ORDER[state.easiest ?? LEVEL_ORDER.indexOf(state.level || level)]].name].filter(Boolean).join(' · ');
  }

  function render(board) {
    const showPanel = !!state;
    show.hidden = !showPanel || !collapsed;
    panel.hidden = !showPanel || collapsed;
    if (!showPanel || collapsed) { fit(); return; }
    const hide = '<button class="tool" id="hide" title="Hide the shortlist">▾</button>';
    if (board.over) {
      panel.innerHTML = `<div class="row"><span class="note">${recap(board)}</span><span class="tools">${hide}</span></div>`;
      fit();
      return;
    }
    const first = !board.rows.length;
    const lv = LEVELS[level];
    const info = `${plural(first ? ANSWERS.length : state.left, 'possible answer')} · ` +
      `<button id="level" title="Level. Easy: picks from the best 10, with hints. Medium: the best 30, with hints. Hard: any possible answer, no hints. The recap shows the easiest level you used">${lv.name} ▸</button>`;
    let html = first ? '<span class="lead">Start with</span>' : '';
    if (!state.picks.length) html += '<span class="note">No word on my list fits these colors</span>';
    const last = state.left === 1;
    for (const p of state.picks) {
      const hint = last ? 'only fit' : lv.hints || first ? leftText(p.left) : '';
      const tip = last ? `${p.word.toUpperCase()}: the only likely answer that fits. Tap to play it`
        : hint ? `${p.word.toUpperCase()}: if it isn't the answer, about ${Math.max(1, Math.round(p.left))} answer${Math.round(p.left) > 1 ? 's' : ''} left on average. Tap to play it`
        : `${p.word.toUpperCase()}: tap to play it`;
      html += `<button class="pick" data-w="${p.word}" title="${tip}"${busy ? ' disabled' : ''}><b>${p.word}</b>${hint ? `<small>${hint}</small>` : ''}</button>`;
    }
    html += `<span class="tools"><button class="tool" id="roll" title="Deal a different shortlist"${busy ? ' disabled' : ''}>🎲</button>${hide}</span>`;
    panel.innerHTML = `<div class="info">${info}</div><div class="row">${html}</div>`;
    fit();
  }

  function refresh(force = false) {
    const board = readBoard();
    if (!board.ready) return;
    place(board);
    if (!host.isConnected) return;
    const sig = sigOf(board.rows);
    if (state?.sig !== sig) busy = false;
    let saved = ls.get(picksKey(), null);
    if (saved && saved.sig !== sig) {
      // one new guess since the last shortlist: note whether it was one of the best picks
      const before = saved.sig ? saved.sig.split(',').length : 0;
      if (board.rows.length === before + 1 && sig.startsWith(saved.sig) && saved.picks?.length > 1) {
        const word = board.rows[before].word;
        const p = saved.picks.find(x => x.word === word);
        const min = Math.min(...saved.picks.map(x => x.left));
        saved.turns = [...(saved.turns || []), { used: !!p, best: !!p && p.left <= min }];
      }
    }
    if (board.over) {
      state = { ...(saved || {}), sig, picks: [], at: Date.now() };
      ls.set(picksKey(), state);
    } else if (force || !saved || saved.sig !== sig || !saved.picks || (board.rows.length && saved.level !== level)) {
      const c = choose(board.rows, LEVELS[level].pool);
      // the recap names the easiest level any shortlist was dealt at (the start word doesn't count)
      const idx = LEVEL_ORDER.indexOf(level);
      const easiest = board.rows.length ? Math.min(saved?.easiest ?? idx, idx) : saved?.easiest;
      state = { sig, left: c.left, picks: c.picks.map(p => ({ ...p, left: Math.round(p.left * 10) / 10 })),
        level, easiest, turns: saved?.turns || [], at: Date.now() };
      ls.set(picksKey(), state);
    } else state = saved;
    render(board);
  }

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function play(word) {
    if (busy) return;
    const board = readBoard();
    if (board.over) return;
    busy = true; render(board);
    for (let i = 0; i < board.typed; i++) { key('←')?.click(); await sleep(30); }
    for (const c of word) { key(c)?.click(); await sleep(30); }
    key('↵')?.click();
    // the board update clears busy; if the game didn't take the word, give the buttons back
    setTimeout(() => { if (busy) { busy = false; render(readBoard()); } }, 4000);
  }

  panel.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    if (b.dataset.w) play(b.dataset.w);
    else if (b.id === 'roll') refresh(true);
    else if (b.id === 'level') {
      level = LEVEL_ORDER[(LEVEL_ORDER.indexOf(level) + 1) % LEVEL_ORDER.length];
      ls.set(LEVEL_KEY, level);
      const board = readBoard();
      if (board.rows.length) refresh(true); // deal a new shortlist at the new level
      else { if (state) { state.level = level; ls.set(picksKey(), state); } render(board); }
    }
    else if (b.id === 'hide') { collapsed = true; ls.set(COLLAPSED_KEY, true); render(readBoard()); }
  });
  show.addEventListener('click', () => { collapsed = false; ls.set(COLLAPSED_KEY, false); render(readBoard()); });

  // the picks sit right above the game's keyboard
  function place(board) {
    const kb = keyboard();
    if (kb) { if (host.nextElementSibling !== kb) kb.parentElement.insertBefore(host, kb); return; }
    // after the game ends the keyboard can be swapped for the game's result buttons:
    // keep the recap just below the board
    const bc = document.querySelector('[class*="Board-module_boardContainer"]');
    if (board?.over && bc && !host.isConnected) bc.after(host);
  }
  // The game sizes its board to the screen, not to the space left, so on a short screen the
  // picks would push the keyboard off the bottom. Then shrink the board by that much instead.
  function fit() {
    const b = document.querySelector('[class*="Board-module_board__"]');
    const kb = keyboard();
    if (!b || !kb) return;
    b.style.transform = b.style.transformOrigin = b.style.marginBottom = '';
    // only the part the picks caused: if the game already runs past the screen, that's its own
    const over = Math.min(host.offsetHeight,
      kb.getBoundingClientRect().bottom - Math.min(innerHeight, window.visualViewport?.height || innerHeight));
    if (over <= 0) return;
    const h = b.offsetHeight;
    const scale = Math.max(0.6, (h - over - 4) / h);
    b.style.transform = `scale(${scale})`;
    b.style.transformOrigin = 'top center';
    b.style.marginBottom = `${-Math.round(h * (1 - scale))}px`;
  }
  addEventListener('resize', () => setTimeout(fit, 200));

  let timer = 0;
  const later = () => { clearTimeout(timer); timer = setTimeout(() => refresh(), 120); };
  new MutationObserver(later).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-state'] });

  tidy();
  refresh();
  if (window.__WSL_TEST__ || ls.get('wsl:debug', false)) {
    window.__wslRoot = root;
    window.__wsl = { pattern, choose, candidates, expectedLeft, ALL, ANSWERS, codes };
  }
})();
