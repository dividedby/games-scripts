// ==UserScript==
// @name         Wordle Guess Picks
// @namespace    https://greasyfork.org/en/users/594496-divided-by
// @author       dividedby
// @description  NYT Wordle with a nudge: a random starting word, then five good guesses to choose from each turn, so you still make the call
// @version      0.1.0
// @license      GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @homepageURL  https://github.com/dividedby/games-scripts
// @supportURL   https://github.com/dividedby/games-scripts/issues
// @match        https://www.nytimes.com/games/wordle*
// @grant        none
// @run-at       document-idle
// @downloadURL  https://raw.githubusercontent.com/dividedby/games-scripts/main/wordle/wordle-guess-picks.user.js
// @updateURL    https://raw.githubusercontent.com/dividedby/games-scripts/main/wordle/wordle-guess-picks.user.js
// ==/UserScript==

(() => {
  'use strict';

  const PICKS = 5;     // guesses offered each turn
  const POOL = 30;     // drawn at random from this many of the best, so some picks are better than others
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
  const codes = w => [...w].map(c => c.charCodeAt(0) - 97);
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
    spare.fill(0);
    return p;
  }
  const STATE = { absent: 0, present: 1, correct: 2 };
  const toPattern = states => states.reduceRight((p, s) => p * 3 + STATE[s], 0);

  // rows: [{ word, states: ['correct'|'present'|'absent' ×5] }]
  function candidates(rows, pool) {
    const done = rows.map(r => ({ g: codes(r.word), p: toPattern(r.states) }));
    return pool.filter(i => done.every(r => pattern(r.g, CODES[i]) === r.p));
  }

  // Hard mode: greens stay in place and every revealed letter is used again
  function allowedInHard(i, rows) {
    const w = ALL[i];
    for (const r of rows) {
      const need = {};
      for (let k = 0; k < 5; k++) {
        const c = r.word[k];
        if (r.states[k] === 'correct' && w[k] !== c) return false;
        if (r.states[k] !== 'absent') need[c] = (need[c] || 0) + 1;
      }
      for (const c in need) if (w.split(c).length - 1 < need[c]) return false;
    }
    return true;
  }

  // Expected number of answers still possible after guessing g (0 when g is the only one left)
  const buckets = new Int32Array(243);
  function expectedLeft(g, cands) {
    const touched = [];
    for (const a of cands) {
      const p = pattern(g, CODES[a]);
      if (buckets[p]++ === 0) touched.push(p);
    }
    let sum = 0;
    for (const p of touched) { if (p !== GREEN_ALL) sum += buckets[p] * buckets[p]; buckets[p] = 0; }
    return sum / cands.length;
  }

  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Returns { left: number of answers still possible, picks: [{ word, left, answer }] }
  function choose(rows, hard) {
    if (!rows.length) {
      const i = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
      return { left: ANSWERS.length, picks: [{ word: ALL[i], left: expectedLeft(CODES[i], ANSWERS), answer: true }] };
    }
    let cands = candidates(rows, ANSWERS);
    if (!cands.length) cands = candidates(rows, ALL.map((_, i) => i)); // the answer isn't on our list
    if (!cands.length) return { left: 0, picks: [] };
    const asked = new Set(rows.map(r => r.word));
    const isCand = new Set(cands);
    const pick = i => ({ word: ALL[i], left: expectedLeft(CODES[i], cands), answer: isCand.has(i) });
    if (cands.length <= 2) return { left: cands.length, picks: cands.map(pick) };
    const scored = [];
    for (let i = 0; i < ALL.length; i++) {
      if (asked.has(ALL[i]) || (hard && !allowedInHard(i, rows))) continue;
      scored.push({ i, e: expectedLeft(CODES[i], cands), answer: isCand.has(i) });
    }
    // fewer answers left first; on a tie, a word that could be the answer
    scored.sort((x, y) => x.e - y.e || (y.answer - x.answer));
    const picks = shuffle(scored.slice(0, POOL)).slice(0, PICKS)
      .sort((x, y) => x.e - y.e || (y.answer - x.answer))
      .map(s => ({ word: ALL[s.i], left: s.e, answer: s.answer }));
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
  const picksKey = () => 'wgp:' + puzzleId();
  const COLLAPSED_KEY = 'wgp:collapsed';

  function tidy() {
    const cutoff = Date.now() - KEEP_DAYS * 864e5;
    try {
      for (const k of Object.keys(localStorage)) {
        const d = k.match(/^wgp:(\d{4}-\d{2}-\d{2})$/)?.[1];
        if (d && ls.get(k, {}).at < cutoff) ls.del(k);
      }
    } catch {}
  }

  // the game's own hard mode setting for this puzzle (or in general)
  function hardMode() {
    try {
      for (const k of Object.keys(localStorage)) {
        if (!/^games-(state|settings)-wordleV2/.test(k)) continue;
        const states = JSON.parse(localStorage.getItem(k))?.states || [];
        const s = states.find(x => x.printDate === puzzleId()) || (k.includes('settings') && states[0]);
        if (s && typeof s.data?.hardMode === 'boolean') return s.data.hardMode;
      }
    } catch {}
    return false;
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
    return { rows, typed, ready: t.length >= 30, over: won || rows.length >= 6 };
  }
  const key = k => document.querySelector(`[data-key="${k}"]`);
  const keyboard = () => key('↵')?.closest('[class*="Keyboard-module_keyboard"]') || key('↵')?.parentElement?.parentElement;

  // ---------- panel ----------
  const host = document.createElement('div');
  host.id = 'wgp-root';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>
    :host { display: block; width: 100%; max-width: 500px; margin: 0 auto; box-sizing: border-box; padding: 0 8px; }
    #wgp { display: flex; align-items: stretch; justify-content: center; gap: 6px; margin: 6px 0 8px; font-family: inherit; }
    #wgp[hidden] { display: none; }
    .lead { align-self: center; font-size: 13px; opacity: .7; white-space: nowrap; }
    button { font: inherit; color: inherit; background: transparent; cursor: pointer; border-radius: 6px;
      border: 1px solid color-mix(in srgb, currentColor 30%, transparent); padding: 4px 2px; touch-action: manipulation; }
    button:hover { background: color-mix(in srgb, currentColor 8%, transparent); }
    button:disabled { opacity: .45; cursor: default; }
    .pick { flex: 1 1 0; min-width: 0; max-width: 92px; display: flex; flex-direction: column; align-items: center; gap: 1px; }
    .pick b { font-size: 15px; letter-spacing: .04em; text-transform: uppercase; }
    .pick small { font-size: 11px; opacity: .75; white-space: nowrap; }
    .pick.ans small::before { content: ''; display: inline-block; width: 7px; height: 7px; border-radius: 50%;
      background: #6aaa64; margin-right: 3px; vertical-align: 0; }
    .tool { flex: 0 0 auto; width: 34px; font-size: 16px; }
    #show { margin: 6px auto 8px; display: block; padding: 4px 10px; font-size: 13px; }
    #show[hidden] { display: none; }
    .note { align-self: center; font-size: 13px; opacity: .75; }
  </style>
  <div id="wgp" hidden></div>
  <button id="show" hidden title="Show guess picks">🎲 Picks</button>`;
  const panel = root.getElementById('wgp');
  const show = root.getElementById('show');

  let state = null;   // { sig, left, picks }
  let busy = false;   // typing a pick in
  let collapsed = ls.get(COLLAPSED_KEY, false);

  const leftText = n => n < 1.5 ? '~1 left' : `~${Math.round(n)} left`;
  const sigOf = rows => rows.map(r => r.word + ':' + toPattern(r.states)).join(',');

  function render(board) {
    const showPanel = state && !board.over;
    show.hidden = !showPanel || !collapsed;
    panel.hidden = !showPanel || collapsed;
    if (!showPanel || collapsed) { fit(); return; }
    const first = !board.rows.length;
    let html = first ? '<span class="lead">Start with</span>' : '';
    if (!state.picks.length) html += '<span class="note">No word on my list fits these colors</span>';
    const last = state.left === 1;
    for (const p of state.picks) {
      const tip = last ? `${p.word.toUpperCase()}: the only likely answer that fits. Tap to play it`
        : `${p.word.toUpperCase()}: about ${Math.max(1, Math.round(p.left))} answer${Math.round(p.left) > 1 ? 's' : ''} left on average after this guess` +
          (p.answer ? ', and it could be the answer' : '') + '. Tap to play it';
      html += `<button class="pick${p.answer ? ' ans' : ''}" data-w="${p.word}" title="${tip}"${busy ? ' disabled' : ''}><b>${p.word}</b><small>${last ? 'only fit' : leftText(p.left)}</small></button>`;
    }
    html += `<button class="tool" id="roll" title="Different picks"${busy ? ' disabled' : ''}>🎲</button>`;
    html += `<button class="tool" id="hide" title="Hide picks">▾</button>`;
    panel.innerHTML = html;
    fit();
  }

  function refresh(force = false) {
    const board = readBoard();
    if (!board.ready || !keyboard()) return;
    place();
    const sig = sigOf(board.rows);
    if (board.over) { state = state && { ...state, sig }; busy = false; render(board); return; }
    if (force || !state || state.sig !== sig) {
      busy = false;
      const saved = ls.get(picksKey(), null);
      if (!force && saved?.sig === sig && saved.picks) state = { sig, left: saved.left, picks: saved.picks };
      else {
        const c = choose(board.rows, hardMode());
        state = { sig, left: c.left, picks: c.picks.map(p => ({ ...p, left: Math.round(p.left * 10) / 10 })) };
        ls.set(picksKey(), { ...state, at: Date.now() });
      }
    }
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
    else if (b.id === 'hide') { collapsed = true; ls.set(COLLAPSED_KEY, true); render(readBoard()); }
  });
  show.addEventListener('click', () => { collapsed = false; ls.set(COLLAPSED_KEY, false); render(readBoard()); });

  // the picks sit right above the game's keyboard
  function place() {
    const kb = keyboard();
    if (kb && host.nextElementSibling !== kb) kb.parentElement.insertBefore(host, kb);
  }
  // The game sizes its board to the screen, not to the space left, so on a short screen the
  // picks would push the keyboard off the bottom. Then shrink the board by that much instead.
  function fit() {
    const b = document.querySelector('[class*="Board-module_board__"]');
    const kb = keyboard();
    if (!b || !kb) return;
    b.style.transform = b.style.transformOrigin = b.style.marginBottom = '';
    const over = kb.getBoundingClientRect().bottom - Math.min(innerHeight, window.visualViewport?.height || innerHeight);
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
  if (window.__WGP_TEST__ || ls.get('wgp:debug', false)) {
    window.__wgpRoot = root;
    window.__wgp = { pattern, choose, candidates, expectedLeft, ALL, ANSWERS, codes };
  }
})();
