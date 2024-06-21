import fs from 'fs'

type Node = {
    name: string
    // targetNode: string
    children: Node[]
}

// Convert data from csv to json for Tidy tree visualization
const tidyTree = () => {
    //read csv file to lines 
    const data = fs.readFileSync('data.csv', 'utf8')
    const lines = data.split('\r\n')
    console.log(lines)

    const records = lines.map(line => {
        const parts = line.split(',')
        return {
            // index: parts[0],
            documentName: parts[1],
            L0: parts[2],
            L1: parts[3],
            L2: parts[4],
            // department: parts[5],
            // subcategory: parts[6],
            // targetDocumentName: parts[7],
            // targetL0: parts[8],
            // targetL1: parts[9],
            // targetL2: parts[10],
            // documentType: parts[11],
            // targetDocumentType: parts[12],
        }
    })

    //remove header
    records.shift()

    const rootNode: Node = {
        name: 'root',
        children: []
    }

    //find L0 nodes
    records.forEach(record => {
        const newL0Node: Node = {
            name: record.L0,
            children: []
        }

        if (!rootNode.children.find(node => node.name === record.L0)) {
            rootNode.children.push(newL0Node)
        }
    })

    //find L1 nodes
    records.forEach(record => {
        const newL1Node: Node = {
            name: record.L1,
            children: []
        }

        const L0Node = rootNode.children.find(node => node.name === record.L0)
        if (!L0Node.children.find(node => node.name === record.L1)) {
            L0Node.children.push(newL1Node)
        }
    })

    //find L2 nodes
    records.forEach(record => {
        const newL2Node: Node = {
            name: record.L2,
            children: []
        }

        const L0Node = rootNode.children.find(node => node.name === record.L0)
        const L1Node = L0Node.children.find(node => node.name === record.L1)
        if (!L1Node.children.find(node => node.name === record.L2)) {
            L1Node.children.push(newL2Node)
        }
    })

    //find files
    // records.forEach(record => {
    //     const newFileNode: Node = {
    //         name: record.documentName,
    //         children: []
    //     }

    //     const L0Node = rootNode.children.find(node => node.name === record.L0)
    //     const L1Node = L0Node.children.find(node => node.name === record.L1)
    //     const L2Node = L1Node.children.find(node => node.name === record.L2)
    //     L2Node.children.push(newFileNode)
    // })

    console.log(JSON.stringify(rootNode, null, 2))

    //write to json file
    fs.writeFileSync('dataNoL3.json', JSON.stringify(rootNode, null, 2))
}


// Convert data from csv to json for HierarchicalEdgeBundling visualization
const HierarchicalEdgeBundling = () => {
    //read csv file to lines 
    const data = fs.readFileSync('dataOriginMod.csv', 'utf8')
    const lines = data.split('\r\n')
    console.log(lines)

    const records = lines.map(line => {
        const parts = line.split(',')
        return {
            index: parts[0],
            documentName: parts[1],
            L0: parts[2],
            L1: parts[3],
            L2: parts[4],
            department: parts[5],
            subcategory: parts[6],
            targetDocumentName: parts[7],
            targetL0: parts[8],
            targetL1: parts[9],
            targetL2: parts[10],
            documentType: parts[11],
            targetDocumentType: parts[12],
        }
    })

    //remove header
    records.shift()

    //convert to hierarchical edge bundling format
    const nodes = []

    for (const record of records) {
        // const newName = `${record.L0}.${record.L1}.${record.L2}.${record.documentName}`
        let newName = `root.${record.L0}.${record.L1}.${record.L2}`
        newName = newName.replace(`\"`, ``)

        const existingNode = nodes.find(node => node.name === newName)
        if (!existingNode) {
            nodes.push({
                name: newName,
                L0: record.L0,
                L1: record.L1,
                L2: record.L2,
                size: 0,
                linkTo: [],
                linkFrom: [],
                linkToDocuments: [],
                linkFromDocuments: [],
                relations: [],
                documents: [],
                sourceDocuments: [],
                targetDocuments: [],
            })
        }

        const targetNewName = `root.${record.targetL0}.${record.targetL1}.${record.targetL2}`
        const targetExistingNode = nodes.find(node => node.name === targetNewName)
        if (!targetExistingNode) {
            nodes.push({
                name: targetNewName,
                L0: record.targetL0,
                L1: record.targetL1,
                L2: record.targetL2,
                size: 0,
                linkTo: [],
                linkFrom: [],
                linkToDocuments: [],
                linkFromDocuments: [],
                relations: [],
                documents: [],
                sourceDocuments: [],
                targetDocuments: [],
            })
        }
    }

    //add document types relations
    for (const record of records) {
        const documentType = record.documentType
        const targetDocumentType = record.targetDocumentType
        const newRelation = `${documentType}->${targetDocumentType}`

        const newName = `root.${record.L0}.${record.L1}.${record.L2}`
        const targetName = `root.${record.targetL0}.${record.targetL1}.${record.targetL2}`

        if (newName === targetName) continue

        //find target node
        const targetExists = nodes.find(node => node.name === targetName)
        if (!targetExists) continue

        //find node index
        const nodeIndex = nodes.findIndex(node => node.name === newName)
        console.log(nodeIndex)
        if (nodeIndex == -1) continue

        //check if relation already exists
        const alreadyExists = nodes[nodeIndex].relations.find(relation => relation === newRelation)
        if (!alreadyExists) {
            nodes[nodeIndex].relations.push(newRelation)
        }
    }

    //add linksTo
    for (const record of records) {
        const newName = `root.${record.L0}.${record.L1}.${record.L2}`
        const targetName = `root.${record.targetL0}.${record.targetL1}.${record.targetL2}`

        if (newName === targetName) continue

        //find target node
        const targetExists = nodes.find(node => node.name === targetName)
        if (!targetExists) continue

        const nodeIndex = nodes.findIndex(node => node.name === newName)
        if (nodeIndex == -1) continue

        const alreadyLinked = nodes[nodeIndex].linkTo.find(link => link === targetName)
        if (!alreadyLinked) {
            nodes[nodeIndex].linkTo.push(targetName)
            nodes[nodeIndex].size = nodes[nodeIndex].size + 1
            nodes[nodeIndex].documentName
        }
    }

    //add linkFrom
    for (const record of records) {
        const newName = `root.${record.L0}.${record.L1}.${record.L2}`
        const targetName = `root.${record.targetL0}.${record.targetL1}.${record.targetL2}`

        if (newName === targetName) continue

        //find target node
        const targetNodeIndex = nodes.findIndex(node => node.name === targetName)
        if (targetNodeIndex == -1) continue

        const nodeExists = nodes.find(node => node.name === newName)
        if (!nodeExists) continue

        const alreadyLinked = nodes[targetNodeIndex].linkFrom.find(link => link === newName)
        if (!alreadyLinked) {
            nodes[targetNodeIndex].linkFrom.push(newName)
        }
    }

    //add linkToDocuments & linkFromDocuments
    for (const record of records) {
        const sourceName = `root.${record.L0}.${record.L1}.${record.L2}`
        const sourceDocName = record.documentName
        const targetName = `root.${record.targetL0}.${record.targetL1}.${record.targetL2}`
        const targetDocName = record.targetDocumentName

        if (sourceName === targetName) continue

        //target node
        const targetNodeIndex = nodes.findIndex(node => node.name === targetName)
        if (targetNodeIndex != -1) {
            const alreadyLinked = nodes[targetNodeIndex].linkFromDocuments.find(link => link === sourceDocName)
            if (!alreadyLinked) {
                nodes[targetNodeIndex].linkFromDocuments.push(sourceDocName)
            }
        }

        //source node
        const sourceNodeIndex = nodes.findIndex(node => node.name === sourceName)
        if (sourceNodeIndex != -1) {
            const alreadyLinked = nodes[sourceNodeIndex].linkToDocuments.find(link => link === targetDocName)
            if (!alreadyLinked) {
                nodes[sourceNodeIndex].linkToDocuments.push(targetDocName)
            }
        }
    }

    //add category documents
    for (const record of records) {
        const categoryA = `root.${record.L0}.${record.L1}.${record.L2}`
        const docA = record.documentName

        const categoryB = `root.${record.targetL0}.${record.targetL1}.${record.targetL2}`
        const docB = record.targetDocumentName

        const nodeAIndex = nodes.findIndex(node => node.name === categoryA)
        if (nodeAIndex != -1) {
            const alreadyExists = nodes[nodeAIndex].documents.find(doc => doc === docA)
            if (!alreadyExists) {
                nodes[nodeAIndex].documents.push(docA)
            }

            //add to sourceDocuments
            const alreadyExistsInSource = nodes[nodeAIndex].sourceDocuments.find(doc => doc === docA)
            if (!alreadyExistsInSource) {
                nodes[nodeAIndex].sourceDocuments.push(docA)
            }
        }

        const nodeBIndex = nodes.findIndex(node => node.name === categoryB)
        if (nodeBIndex != -1) {
            const alreadyExists = nodes[nodeBIndex].documents.find(doc => doc === docB)
            if (!alreadyExists) {
                nodes[nodeBIndex].documents.push(docB)
            }

            //add to targetDocuments
            const alreadyExistsInTarget = nodes[nodeBIndex].targetDocuments.find(doc => doc === docB)
            if (!alreadyExistsInTarget) {
                nodes[nodeBIndex].targetDocuments.push(docB)
            }
        }


    }

    //write to json file
    fs.writeFileSync('HierarchicalEdgeBundlingL3V7DataOrigin.json', JSON.stringify(nodes, null, 2))
}

// Run the script
HierarchicalEdgeBundling()
// tidyTree()