import React from 'react';
import logo from './logo.svg';
import './App.css';


class App extends React.Component{
  constructor(props){
    super(props);
    this.state ={
      JSONoutput: [],
      fileReader:'',
      data: '',
      excelOutput:'',
    }
    
  }

  
generateNine(){
  let a = ''
  for(let i = 0; i < 9; i++){
      let b = Math.floor(Math.random()*10)
      a += b
  }
  return a;
}

generateRandomUUID(conceptIdList){
  //return uuidv4();
  let num = this.generateNine()
  while(!conceptIdList.includes(num)){
      let num = this.generateNine();
      return num;
  }
}

processCluster(cluster, header, nameToConcept, indexVariableName, conceptIdList, conceptIdObject, sourceJSONS, jsonList){
  let nonEmpty = [];
  let list = [1,2,3]
  let conceptIdObjectKeys =Object.keys(conceptIdObject)
  let conceptIdIndices = [];
  let generalId = -1;
  let conceptIdReverseLookup = {};
  for(let i = 0; i < conceptIdObjectKeys.length; i++){
      conceptIdIndices.push(parseInt(conceptIdObjectKeys[i]))
      conceptIdReverseLookup[conceptIdObject[conceptIdObjectKeys[i]]] = parseInt(conceptIdObjectKeys[i])
  }
  //console.log(conceptIdReverseLookup)
  //console.log(conceptIdIndices)
  for(let i = 1; i < cluster.length; i++){
      let currArr = cluster[i]
      for(let j = 0; j < currArr.length; j++){
          if(currArr[j]!='' && !conceptIdIndices.includes(j)){
              if(!nonEmpty.includes(j)){
                  nonEmpty.push(j)
              }
          }
      }
  }
  
  let firstRowJSON = {}
  let firstRow = cluster[0]
  let clump = [];
  for(let i = 0; i < firstRow.length; i++){
      if(firstRow[i] != "" && !nonEmpty.includes(i) && !conceptIdIndices.includes(i)){
          firstRowJSON[header[i]] = firstRow[i]
      }
  }
  //console.log(JSON.stringify(cluster))
  if(!firstRowJSON.hasOwnProperty('conceptId') || firstRowJSON['conceptId'] == ''){
      if(nameToConcept.hasOwnProperty(firstRow[indexVariableName])){
          firstRowJSON['conceptId'] = nameToConcept[firstRow[indexVariableName]]
          if(!conceptIdList.includes(firstRowJSON['conceptId'])){
              conceptIdList.push(firstRowJSON['conceptId'])
          }
          
      }
      else{
           firstRowJSON['conceptId'] = this.generateRandomUUID(conceptIdList);
           conceptIdList.push(firstRowJSON['conceptId'])
           nameToConcept[firstRow[indexVariableName]] = firstRowJSON['conceptId']
      }
  }
  firstRow[conceptIdReverseLookup['thisRowId']] = firstRowJSON['conceptId']
  
  //find sources first
  let conceptColNames = Object.keys(conceptIdReverseLookup)
  for(let i = 0; i < conceptColNames.length; i++){
      if(conceptColNames[i].indexOf('Source') != -1){
          let currId = firstRow[conceptIdReverseLookup[conceptColNames[i]]]
          
          let currVarName = firstRow[conceptIdReverseLookup[conceptColNames[i]] + 1]
          
          if(currId == '' && nameToConcept.hasOwnProperty(currVarName)){
              currId = nameToConcept[currVarName]
          }

          let found = -1;
          for(let j = 0; j < sourceJSONS.length; j++){
              let currJSON = sourceJSONS[j];
              if(currId != '' && currJSON['conceptId'] == currId){
                  found = i;
                  if(!currJSON['subcollections'].includes(firstRowJSON['conceptId'] + '.json')){
                      currJSON['subcollections'].push(firstRowJSON['conceptId'] + '.json')
                  }
                  j = sourceJSONS.length;
              }
              else if(currId == '' && currVarName == currJSON['Variable Name']){
                  found = i;
                  currId = currJSON['conceptId'];
                  if(!currJSON['subcollections'].includes(firstRowJSON['conceptId'] + '.json')){
                      currJSON['subcollections'].push(firstRowJSON['conceptId'] + '.json')
                  }
                  j = sourceJSONS.length
              }
          }
          if(found == -1){
              let newJSON = {}
              if(currId == ''){
                  currId = this.generateRandomUUID(conceptIdList);
              }
              
              newJSON['conceptId'] = currId;
              newJSON['Variable Name'] = currVarName;
              newJSON['subcollections'] = [firstRowJSON['conceptId'] + '.json']
              sourceJSONS.push(newJSON)
          }
          nameToConcept[currVarName] = currId
          if(!conceptIdList.includes(currId)){
              conceptIdList.push(currId)
          }
          
          firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]] = currId + '.json'
          firstRow[conceptIdReverseLookup[conceptColNames[i]]] = currId;
      }
  }

  let collections = [];
  let collectionIds = [];
  let leaves = []
  let leafIndex = -1;
  let leafObj = {}
  for(let i = 0; i < cluster.length; i++){
      let ids = [];
      let currCollection = {}
      let leaf = ''
      let currRow = cluster[i];
      for(let j = 0; j < nonEmpty.length; j++){
          let currObject = {} 
          
          
          let nonEmptyIndex = nonEmpty[j];
          
          let currValue = currRow[nonEmptyIndex]
          
          //console.log(currValue)
          //console.log(JSON.stringify(nonEmpty))
          //console.log(header)
          //console.log(currRow)
          if(currValue.indexOf('=') != -1){
              leaf = currValue;
              leafIndex = nonEmptyIndex;
              leaves.push(currValue)
              let val = leaf.split('=')[1].trim()
              let key = leaf.split('=')[0].trim()
              let cid = this.generateRandomUUID(conceptIdList)
              if(nameToConcept.hasOwnProperty(val)){
                  cid = nameToConcept[val]
              }
              if(currRow[leafIndex - 1] != ''){
                  cid = currRow[leafIndex-1];
              }
              
              jsonList.push({'conceptId':cid, 'variableName':val})
              nameToConcept[val] = cid
              
              if(!conceptIdList.includes(cid)){
                  conceptIdList.push(cid)
              }
              leafObj[cid + '.json'] = key
              currRow[leafIndex-1] = cid
          }
          
          else{
              if(currRow[nonEmptyIndex] != ''){
                  currCollection[header[nonEmptyIndex]] = currRow[nonEmptyIndex]
              }
          }
          
      }
      if(currRow[conceptIdReverseLookup['leftMostId']] != ''){
          currCollection['conceptId'] = currRow[conceptIdReverseLookup['leftMostId']]
      }
      if(Object.keys(currCollection).length != 0){
          let cid = this.generateRandomUUID(conceptIdList)
          let objKeys = Object.keys(currCollection);
          for(let i = 0; i < objKeys.length; i++){
              //console.log(key)
              let key = objKeys[i];
              if(nameToConcept.hasOwnProperty(currCollection[key])){
                  cid = nameToConcept[currCollection[key]]
              }
          }
          
          if(currCollection.hasOwnProperty('conceptId')){
              cid = currCollection['conceptId'];
          }
          if(!conceptIdList.includes(cid)){
              conceptIdList.push(cid);
          }
          currCollection['conceptId'] = cid;
          collectionIds.push(cid + '.json')
          for(let i = 0; i < objKeys.length; i++){
              //console.log(key)
              let key = objKeys[i]
              nameToConcept[currCollection[key]] = cid;
          }
          collections.push(currCollection);
          cluster[i][conceptIdReverseLookup['leftMostId']] = cid;
      }   
  }

  if(collections.length == 0  && leaves.length > 0){
      firstRowJSON[header[leafIndex]] = leafObj;
  }
  else{
      firstRowJSON['subcollection'] = collectionIds;
      for(let i = 0; i < collections.length; i++){
          let currCollection = collections[i]
          currCollection[header[leafIndex]] = leafObj;
          jsonList.push(currCollection)

      }
  }
  
  if(cluster[0][conceptIdReverseLookup['thisRowId']] == ''){
      firstRowJSON['conceptId'] = this.generateRandomUUID(conceptIdList);
      if(nameToConcept.hasOwnProperty(firstRowJSON[header[indexVariableName]])){
          firstRowJSON['conceptId'] = nameToConcept[firstRowJSON[header[indexVariableName]]];
      }
      cluster[0][conceptIdReverseLookup['thisRowId']] = firstRowJSON['conceptId']
      nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
  }
  else{
      firstRowJSON['conceptId'] = cluster[0][conceptIdReverseLookup['thisRowId']]
      nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
  }
  jsonList.push(firstRowJSON);
  return cluster;

}

CSVToArray(strData){
  let arr = [];
  while(strData.indexOf(",") != -1 ){
      let toPush = "";
      if(strData.substring(0,1) == "\""){
          strData = strData.substring(1);
          toPush = strData.substring(0,  strData.indexOf("\""));    
          strData = strData.substring(strData.indexOf("\"") + 1);    
          strData = strData.substring(strData.indexOf(',')+1)
      }
      else{
          toPush = strData.substring(0, strData.indexOf(','));
          strData = strData.substring(strData.indexOf(',') + 1)
      }
      arr.push(toPush)

      //let nextQuote = strData.indexOf("\"")
  }
  if(strData != ""){
      arr.push(strData);
  }

  // Return the parsed data.
  return( arr );
}

lookForConcepts(cluster, header, idsToInsert, leftMost){
  //console.log(cluster)
  let leafIndex = -1;
  let nonEmpty = [];
  for(let i = 1; i < cluster.length; i++){
      let currArr = cluster[i]
      for(let j = 0; j < currArr.length; j++){
          if(currArr[j]!=''){
              if(!nonEmpty.includes(j)){
                  nonEmpty.push(j)
              }
              if(currArr[j].indexOf('=') != -1){
                  if(!idsToInsert.includes(j)){
                      idsToInsert.push(j)    
                  }
                  leafIndex = j
              }
          }
      }
  }
  for(let i = 0; i < nonEmpty.length; i++){
      if(nonEmpty[i] != leafIndex && nonEmpty[i] < leftMost[0] && header[nonEmpty[i]] != 'conceptId'){
          leftMost[0] = nonEmpty[i];
          leftMost[1] = header[nonEmpty[i]]
      }
  }
  //console.log(nonEmpty)
  //identify which one is the leaf

}

getConceptIds(data){

  //first, get all columns that require conceptids
  //next, check if column to the right has concept id
  //if it does, add to array, if it doesnt, maybe add to file
  //keywords: source
  //Look for columns with clusters
  let varLabelIndex = 0;
  let cluster = []
  let first = true;
  let currCluster = false;
  let header = [];
  let idsToInsert = [];
  let idsFound = []
  let conceptIdIndices = []
  let leftMost = []
  let firstNotSource = -1;
  let lines = data.split('\n')
  //console.log(nameToConcept)
  for(let x = 0; x < lines.length; x++){
      let line = lines[x]
      //console.log(line)
      //let arr = line.split(',');
      let arr = this.CSVToArray(line, ',')
      if(first){
          //console.log(line)
          header = arr;
          first = false;
          for(let i = 0; i < arr.length; i++){
              if(arr[i] == "Variable Name"){
                  varLabelIndex = i;
                  //console.log(varLAbelIndex)
              }
              if(arr[i].indexOf('Source') != -1){
                  idsToInsert.push(i)
              }
              else if(arr[i].indexOf('conceptId') != -1){
                  conceptIdIndices.push(i)
                  idsFound.push(arr[i])
              }
              else{
                  if(firstNotSource == -1 && arr[i] != ''){
                      idsToInsert.push(i)
                      firstNotSource = i
                  }
              }
              
          }
          leftMost.push(arr.length)
          leftMost.push('')
      }
      else if(currCluster){
          if(arr[varLabelIndex] == ''){
              cluster.push(arr);
          }
          else{
              this.lookForConcepts(cluster, header, idsToInsert, leftMost)
          }
      }
      else{
          cluster.push(arr)
          currCluster = true;
      }
  }
  this.lookForConcepts(cluster, header, idsToInsert, leftMost);
  if(!idsToInsert.includes(leftMost[0])){
      idsToInsert.push(leftMost[0])
      //console.log(leftMost[0])
  }
  let nonIntersects = []
  for(let i = 0; i < idsToInsert.length; i++){
      let found = false;
      for(let j = 0; j < conceptIdIndices.length; j++){
          if(idsToInsert[i] == conceptIdIndices[j] + 1){
              found = true;
          }
      }
      if(found == false){
          nonIntersects.push(idsToInsert[i])
      }
  }

  //sorts in descending order
  nonIntersects.sort(function(a, b){return b - a})
  let toWrite ='';
  first = true;
  let finalConceptIndices = {};
  lines = data.split('\n')
  for (let x = 0; x < lines.length; x ++){
      let line = lines[x]
      let arr = line.split(',')
      if(first == true){
          let general = arr[firstNotSource]
          for(let i = 0; i < nonIntersects.length; i++){
              arr.splice(nonIntersects[i],0,'conceptId')
          }
          toWrite += arr.join(",");
          first = false;
          for(let i = 0; i < arr.length; i++){
              if(arr[i].includes('conceptId') && i != arr.length - 1){
                  if(arr[i+1] == general){
                      finalConceptIndices[i] = 'thisRowId'
                  }
                  else if(arr[i+1] == leftMost[1]){
                      finalConceptIndices[i] = 'leftMostId'
                  }
                  else{
                      finalConceptIndices[i] = arr[i+1]
                  }
              }
          }
      }   
      else{
          for(let i = 0; i < nonIntersects.length; i++){
              arr.splice(nonIntersects[i],0,'')
          }
          toWrite += '\n'
          toWrite += arr.join(",");
      }
      //console.log(arr)
  }

  //console.log(toWrite)
  this.state.data = toWrite;
  //console.log(JSON.stringify(finalConceptIndices))
  return finalConceptIndices;
}

readFile(data){
  let jsonList = []
  let sourceJSONS = []
  let ConceptIndex = '{}'
  let idIndex = '[]'
  //console.log('idIndex: ' + idIndex)
  let conceptIdList = JSON.parse(idIndex)
  let varLabelIndex = 0;
  let cluster = []
  let conceptIdObject = this.getConceptIds(data)
  
  let excelOutput = []

  let first = true;
  let currCluster = false;
  let header = [];
  let nameToConcept = JSON.parse(ConceptIndex);
  let lines = this.state.data.split('\n')
  //console.log(nameToConcept)
  for (let x = 0; x < lines.length; x++){
      //console.log(line)
      //let arr = line.split(',');
      let line = lines[x]
      let arr = this.CSVToArray(line, ',')
      if(first){
          header = arr;
          first = false;
          for(let i = 0; i < arr.length; i++){
              if(arr[i] == "Variable Name"){
                  varLabelIndex = i;
              }
          }
          excelOutput.push([arr])
      }
      else if(currCluster){
          if(arr[varLabelIndex] == ''){
              cluster.push(arr);
          }
          else{
              let returned = this.processCluster(cluster, header, nameToConcept, varLabelIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList)
              excelOutput.push(returned)
              cluster = [arr]
              currCluster = true;
          }
      }
      else{
          cluster.push(arr)
          currCluster = true;
      }
  }
  let returned = this.processCluster(cluster, header, nameToConcept, varLabelIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList);
  excelOutput.push(returned)
  for(let i = 0; i < sourceJSONS.length; i++){
      jsonList.push(sourceJSONS[i])
  }

  //console.log(excelOutput)
  
  let toPrint = '';
  for(let i=0; i < excelOutput.length; i++){
      let cluster = excelOutput[i]
      for(let j = 0; j < cluster.length; j++){
          let row = cluster[j]
          toPrint += cluster[j].map(function(value){
              if(value.indexOf(',') != -1){
                  return "\"" + value + "\"";
              }
              else{
                  return value;
              }
          }).join(",");
          //console.log(cluster)
          if(i!=excelOutput.length-1 || j!=cluster.length -1){
              toPrint += '\n'
          }
      }
  }
  this.setState({excelOutput:toPrint})
  //console.log(this.state.toPrint)
  let toReturn = ''
  for(let i = 0; i < jsonList.length; i++){
    toReturn += JSON.stringify(jsonList[i], null, '    ') + '\n'
  }
  //return JSON.stringify(jsonList, null, '\t');
  return jsonList
  //console.log(toPrint)
  //console.log(conceptIdList)
  
}
  handleFileRead = (e) => {
    const content = this.state.fileReader.result;
    let response = this.readFile(content)
    const element = document.createElement("a");
    const file = new Blob([this.state.excelOutput], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "myFile.csv";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    this.setState({JSONoutput:response})
  }
  

  handleFileChosen = (file) => {
    this.state.fileReader = new FileReader();
    this.state.fileReader.onloadend = this.handleFileRead;
    this.state.fileReader.readAsText(file);
  }
  getNumSpaces=(str) =>{
    let numStart = 0;
    for(let i = 0; i < str.length; i++){
      if(str.substring(i, i+1) == '-'){
        numStart += 1;
      }
      else{
        return numStart * 16 + 'px'
      }
    }
    return numStart * 16 + 'px';
  }
  removeLeading = (str)=>{
    let numStart = 0;
    for(let i = 0; i < str.length; i++){
      if(str.substring(i, i+1) == '-'){
        numStart += 1;
      }
      else{
        return str.substring(numStart)
      }
    }
    return str.substring(numStart);
  }
  render(){
    return (
      <div className="App" style={{'text-align':'left'}}>
        <header className="App-header" style = {{'font-size':'16px', 'padding-top':'50px', 'padding-bottom':'50px'}}>
          <input type='file'
                 id='file'
                 className='input-file'
                 accept='.csv'
                 onChange={e=>this.handleFileChosen(e.target.files[0])}
          ></input>
          <div>
      </div>
          <div>
              {this.state.JSONoutput.map(s => (<p>{JSON.stringify(s, null, '-').split('\n').map((item) => {
                return (
                  <span style = {{'padding-left':this.getNumSpaces(item)}}>
                  {this.removeLeading(item)}
                  <br/>
                  </span>
                )
              })}</p>))}
          </div>
        </header>
      </div>
    );
  }
}
export default App;
