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
      textAreaValue:'',
    }
    
  }

reverseRead(jsonString){
    
    let jsonList = JSON.parse(jsonString)
    let jsonIndex = {}
    for(let i = 0; i < jsonList.length; i++){
        let currJSON = jsonList[i]
        jsonIndex[currJSON['conceptId']] = i
    }
    
    let referenced = [];
    let clean = [];
    for(let i = 0; i < jsonList.length; i++){
        let currFile = jsonList[i];
        let keys = Object.keys(currFile);
        for(let j = 0; j < keys.length; j++){
            let nextObj = currFile[keys[j]]
            if(keys[j].includes('Source')){
                if(!clean.includes(i)){
                    clean.push(i)
                }
            }
            if(Array.isArray(nextObj)){
                //iterate through array and look for json
                let toReplace = []
                for(let k = 0; k < nextObj.length; k++){
                    let toCheck = nextObj[k]
                    
                    if(toCheck.match(/[0-9]{9}.json/) != null){
                        let cId = toCheck.substring(0,9);
                        toReplace.push(jsonList[jsonIndex[cId]])
                        if(!referenced.includes(jsonIndex[cId])){
                            referenced.push(jsonIndex[cId])
                        }
                    }
                    
                }
                if(toReplace.length > 0){
                    currFile[keys[j]] = toReplace;
                }
            }
            else if(typeof nextObj == 'string'){
                if(nextObj.match(/[0-9]{9}.json/) != null){
                    let cId = nextObj.substring(0,9);
                    currFile[keys[j]] = jsonList[jsonIndex[cId]];
                    if(!referenced.includes(jsonIndex[cId])){
                        referenced.push(jsonIndex[cId])
                    }
                }
                //check if string is JSON
            }
            else{
                let currKeys = Object.keys(nextObj)
                let toReplace = {};
                for(let k = 0; k < currKeys.length; k++){
                    if(currKeys[k].match(/[0-9]{9}.json/)){
                        let cId = currKeys[k].substring(0,9);
                        toReplace[nextObj[currKeys[k]]] = jsonList[jsonIndex[cId]];
                        if(!referenced.includes(jsonIndex[cId])){
                            referenced.push(jsonIndex[cId])
                        }
                    }
                }
                if(Object.keys(nextObj).length > 0){
                    currFile[keys[j]] = toReplace;
                }
                //check object for JSON
            }
        }
    }
    for(let i = 0; i < jsonList.length; i++){
        if(!referenced.includes(i)){
            if(!clean.includes(i)){
                clean.push(i)
            }
        }
    }


    let finalMatrix = []
    let finalHeader = []
    let finalConcepts = []
    let maxes = []
    //change to make it recursive
    for(let i = 0; i < clean.length; i ++){
        let conceptSeen = [jsonList[clean[i]]['conceptId']]
        let final = {}
        this.recurseRead(jsonList[clean[i]],final, '', conceptSeen)
        finalMatrix.push(final)

        //finalHeader.concat(Object.keys(final)).unique()



        let keys = Object.keys(final)
        let finalArr = []
        let max = 0;
        for(let j = 0; j < keys.length; j++){
            if(!finalHeader.includes(keys[j]) && !finalConcepts.includes(keys[j])){
                if(!keys[j].includes('conceptId')){
                    if(!keys[j].includes('subcollection') && !keys[j].includes('subcollections')){
                        finalHeader.push(keys[j])
                    }
                }
                else{
                    finalConcepts.push(keys[j])
                }
            }

            if(final[keys[j]].length > max){
                max = final[keys[j]].length
            }
        }

        maxes.push(max)
        
        //console.log(finalArr)


    }
    /*
    let toExcel = "";
    toExcel += keys.map(function(value){
        if(value.indexOf(',') != -1){
            return "\"" + value + "\"";
        }
        else if(value == '0'){
            return ''
        }
        else{
            return value;
        }
    }).join(",");
    for(let j = 0; j < finalArr.length; j++){
        toExcel += '\n'
        toExcel += finalArr[j].map(function(value){
            if(value.indexOf(',') != -1){
                return "\"" + value + "\"";
            }
            else{
                return value;
            }
        }).join(",");
    }
    //console.log(toExcel)
    fs.writeFileSync('testOutput1.csv', toExcel)
*/
    //
    //reorder the finalHeader
    //console.log(finalConcepts)
    //try while organizing data: if key == subcollection, use single key from thing
    let first = false;
    for(let i = 0; i < finalHeader.length; i++){
        let found = false;
        for(let j = 0; j < finalConcepts.length; j++){    
            if(finalConcepts[j].includes(finalHeader[i])){
                finalHeader.splice(i,0,finalConcepts[j])
                i += 1;
                j = finalConcepts.length
                found =true
            }
        }
        if(found == false && first == false){
            finalHeader.splice(i,0,'conceptId')
            i += 1;
            first = true;
        }
        
    }
    //console.log(finalHeader)



    let toExcel = ''
    toExcel += finalHeader.map(function(value){
        if(value.indexOf('conceptId') != -1){
            return 'conceptId'
        }
        if(value.indexOf(',') != -1){
            return "\"" + value + "\"";
        }
        else if(value == '0'){
            return ''
        }
        else{
            return value;
        }
    }).join(",");
    //console.log(finalMatrix[1])
    for(let i =0 ; i < finalMatrix.length; i++){
       
        let max = maxes[i]
        let finalArr = [];
        let currItem = finalMatrix[i] 
    
        for(let k = 0; k < max; k++){
            let toInsert = []
            for(let j = 0; j < finalHeader.length; j++){

                toInsert.push('')

            }
            finalArr.push(toInsert);
        }
        for(let j = 0; j < finalHeader.length; j++){
            let currKey = finalHeader[j]
            
            if(currItem.hasOwnProperty(currKey)){
                let currArr = currItem[currKey]
                if(currKey != '0'){
                    for(let k = 0; k < currArr.length; k++){
                        finalArr[k][j] = currArr[k]
                    }
                }
            }
        }
        for(let j = 0; j < finalArr.length; j++){
            toExcel += '\n'
            toExcel += finalArr[j].map(function(value){
                if(value.indexOf(',') != -1){
                    return "\"" + value + "\"";
                }
                else{
                    return value;
                }
            }).join(",");
        }

    }    
        
    


    return toExcel;
    //console.log(toExcel)
    //console.log(finalConcepts)
}

recurseRead(curr,final, key, conceptSeen, isSource){
    let keys = Object.keys(curr)
    let toPrint = []

    if(curr.hasOwnProperty('conceptId') && key != ''){
        let nextObj = curr['conceptId']
        if(key == 'subcollections' || key == 'subcollection'){
            let found = -1;
            let firstWithoutconceptId = -1;
            for(let i = 0; i < keys.length; i++){
                if(final.hasOwnProperty('conceptId' + keys[i]) && keys[i] != '' && keys[i] != 'subcollections'&& keys[i] != 'subcollection' && found == -1){
                    found = i;
                }
                if(!keys[i].includes('conceptId') && firstWithoutconceptId == -1 && keys[i] != 'subcollections'&& keys[i] != 'subcollection'){
                    firstWithoutconceptId = i
                }
            }
            let toChange = ''
            if(found == -1){
                toChange = keys[firstWithoutconceptId]
            }
            else{
                toChange = keys[found]
            }
            
            if(final.hasOwnProperty('conceptId' + toChange)){
                if(!final['conceptId' + toChange].includes(nextObj)){
                    final['conceptId' + toChange].push(nextObj)
                }
            }
            else{
                final['conceptId' + toChange] = [nextObj]
            }
        }
        else{
            if(final.hasOwnProperty('conceptId' + key)){
                if(!final['conceptId' + key].includes(nextObj)){
                    final['conceptId' + key].push(nextObj)
                }
            }
            else{
                final['conceptId' + key] = [nextObj]

            }
        }
    }
    
    for(let j = 0; j < keys.length; j++){
        let nextObj = curr[keys[j]]
        if(Array.isArray(nextObj)){
            let arr = []
            for(let k = 0; k <nextObj.length; k++){
                if(typeof nextObj[k] != 'string'){
                    if(!conceptSeen.includes(nextObj[k]['conceptId'])){
                        conceptSeen.push(nextObj['conceptId'])
                        if(!key.includes('Source')){
                            let returned = this.recurseRead(nextObj[k], final, keys[j], conceptSeen)
                            arr.push(returned)
                        }
                    }
                }
                else{
                    //console.log(JSON.stringify(nextObj))
                }
                
            }
            //console.log(keys[j])
            //console.log(arr)
        }

        else if(typeof nextObj == 'string'){
            if(keys[j] != 'conceptId' && key != 'conceptId'){
                if(key == '' || key == 'subcollection'){
                    if(final.hasOwnProperty(keys[j])){
                        if(!final[keys[j]].includes(nextObj)){
                            final[keys[j]].push(nextObj)
                        }
                    }
                    else{
                        final[keys[j]] = [nextObj]
                    }
                    //toPrint.push(keys[j] + ':' + nextObj)
                    //console.log(keys[j] + ': ' + nextObj)
                }
                else{
                    if(final.hasOwnProperty(key)){
                        if(!final[key].includes(nextObj)){
                            final[key].push(nextObj)
                        }
                        
                    }
                    else{
                        final[key] = [nextObj]
                    }
                    //toPrint.push(key + ':' + nextObj)
                    //console.log(key + ': ' + nextObj)
                }
            }

            else if(keys[j] == 'conceptId' && key == ''){
                if(final.hasOwnProperty('conceptId' + key)){
                    if(!final['conceptId' + key].includes(nextObj)){
                        final['conceptId' + key].push(nextObj)
                    }
                }
                else{
                    final['conceptId' + key] = [nextObj]
                }
            }
        
        }


        else{
            if(!nextObj.hasOwnProperty('conceptId') || !conceptSeen.includes(nextObj['conceptId'])){
                if(nextObj.hasOwnProperty('conceptId')){
                    conceptSeen.push(nextObj['conceptId'])
                    this.recurseRead(nextObj, final, keys[j], conceptSeen)
                }
                else{
                    let kList = Object.keys(nextObj);
                    
                    for(let k = 0; k < kList.length; k++){

                        if(nextObj[kList[k]].hasOwnProperty('variableName') && !nextObj[kList[k]]['variableName'].includes('=')){
                            nextObj[kList[k]]['variableName'] = kList[k] + '=' + nextObj[kList[k]]['variableName']
                        }
                        this.recurseRead(nextObj[kList[k]], final, keys[j], conceptSeen)
                    }
                }
            }

        }

    }
    //console.log(toPrint)

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

    for(let i = 1; i < cluster.length; i++){
        let currArr = cluster[i]
        for(let j = 0; j < currArr.length; j++){
            if(currArr[j].trim()!='' && !conceptIdIndices.includes(j)){
                if(!nonEmpty.includes(j)){
                    nonEmpty.push(j)
                }
            }
        }
    }
    
    let firstRowJSON = {}
    let firstRow = cluster[0]
    let clump = [];
    console.log(JSON.stringify(conceptIdObject))
    for(let i = 0; i < firstRow.length; i++){
        if(firstRow[i] != "" && !nonEmpty.includes(i) || (conceptIdIndices.includes(i) && conceptIdObject[i] =="thisRowId")){
            firstRowJSON[header[i]] = firstRow[i]
        }
    }
    console.log(JSON.stringify(firstRowJSON))
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
                
                //fs.writeFileSync(cid + '.json', JSON.stringify({'conceptId':cid, 'variableName':val}));
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
        if(conceptIdReverseLookup.hasOwnProperty('leftMostId') && currRow[conceptIdReverseLookup['leftMostId']] != ''){
            currCollection['conceptId'] = currRow[conceptIdReverseLookup['leftMostId']]
        }
        if(Object.keys(currCollection).length != 0){
            let cid = this.generateRandomUUID(conceptIdList)
            let objKeys = Object.keys(currCollection);
            for(let i = 0; i < objKeys.length; i++){
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
                let key = objKeys[i]
                nameToConcept[currCollection[key]] = cid;
            }
            collections.push(currCollection);
            cluster[i][conceptIdReverseLookup['leftMostId']] = cid;
            //fs.writeFileSync(cid + '.json', currCollection);
        }   
    }

    if(collections.length == 0  && leaves.length > 0){
        firstRowJSON[header[leafIndex]] = leafObj;
    }
    else{
        if(collectionIds.length != 0){
            firstRowJSON['subcollection'] = collectionIds;
        }
        for(let i = 0; i < collections.length; i++){
            let currCollection = collections[i]
            currCollection[header[leafIndex]] = leafObj;
            //fs.writeFileSync(currCollection['conceptId']+ '.json', JSON.stringify(currCollection));
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
  strData = strData.trim()
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
    arr.push(strData);

  // Return the parsed data.
  return( arr );
}

lookForConcepts(cluster, header, idsToInsert, leftMost){
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
  let leftMostStart = -1;
  let firstNotSource = -1;
  let lines = data.split('\n')

  for(let x = 0; x < lines.length; x++){
      let line = lines[x]

      //let arr = line.split(',');
      let arr = this.CSVToArray(line, ',')
      if(first){
          header = arr;
          first = false;
          for(let i = 0; i < arr.length; i++){
              if(arr[i] == "Variable Name"){
                  varLabelIndex = i;
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
          leftMostStart = arr.length;
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
  if(!idsToInsert.includes(leftMost[0]) && leftMost[0] != leftMostStart){
      idsToInsert.push(leftMost[0])
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
          toWrite += arr.map(function(value){
            if(value.indexOf(',') != -1){
                return "\"" + value + "\"";
            }
            else{
                return value;
            }
          }).join(",");
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
          toWrite += arr.map(function(value){
            if(value.indexOf(',') != -1){
                return "\"" + value + "\"";
            }
            else{
                return value;
            }
        }).join(",");
      }
  }

  this.state.data = toWrite;
  return finalConceptIndices;
}

readFile(data){
  let jsonList = []
  let sourceJSONS = []
  let ConceptIndex = '{}'
  let idIndex = '[]'
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
  for (let x = 0; x < lines.length; x++){
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
          if(i!=excelOutput.length-1 || j!=cluster.length -1){
              toPrint += '\n'
          }
      }
  }
  this.setState({excelOutput:toPrint})
  let toReturn = ''
  for(let i = 0; i < jsonList.length; i++){
    toReturn += JSON.stringify(jsonList[i], null, '    ') + '\n'
  }
  //return JSON.stringify(jsonList, null, '\t');
  return jsonList

}
  handleFileRead = (e) => {
    const content = this.state.fileReader.result;
    let response = this.readFile(content)
    const element = document.createElement("a");
    const file = new Blob([this.state.excelOutput], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "myFile.csv";
    document.body.appendChild(element); // Required for this to work in FireFox
    //element.click();
    console.log(JSON.stringify(response))
    this.setState({JSONoutput:response})
  }
  
  handleCreateReverse = (e) => {
    let output = this.reverseRead(this.state.textAreaValue)
    //console.log(output)
    const element = document.createElement("a");
    const file = new Blob([output], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "myFile.csv";
    document.body.appendChild(element); // Required for this to work in FireFox
    //element.click();
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
  handleChange = (event) =>{
    console.log(this.state.textAreaValue)
    this.setState({textAreaValue:event.target.value})
  }
  render(){
    return (
      <div className="App" style={{'text-align':'left'}}>
        <header className="App-header" style = {{'font-size':'16px', 'padding-top':'50px', 'padding-bottom':'50px'}}>
          <h2>CSV to JSONS</h2>
          <input type='file'
                 id='file'
                 className='input-file'
                 accept='.csv'
                 onChange={e=>this.handleFileChosen(e.target.files[0])}
          ></input>
          <div style = {{'text-align':'center'}}>
              <p>CSV Rules:</p>
              <p>There must be a Variable Name field in every full row</p>
              <p>The leaf nodes (final unit of response) is the only row that is allowed to have an equals sign</p>
          </div>
          
          <div style = {{'padding-left': '50px', 'padding-right':'50px'}}>
              {this.state.JSONoutput.map(s => (<p>{JSON.stringify(s, null, '-').split('\n').map((item) => {
                return (
                  <span style = {{'padding-left':this.getNumSpaces(item)}}>
                  {this.removeLeading(item)}
                  <br/>
                  </span>
                )
              })}</p>))
              /*JSON.stringify(this.state.JSONoutput)*/}
          </div>
          <br/>
          <br/>
          <h2>JSONS to CSV</h2>
          <p>Enter a list of JSONS, and we will generate a csv file for it</p>
          <div>
            <textarea
                value={this.state.textAreaValue}
                onChange={this.handleChange}
                rows={10}
                cols={50}
                />
          </div>
          <button type="button" onClick={this.handleCreateReverse}>Convert!</button>
        </header>

      </div>
    );
  }
}
export default App;
