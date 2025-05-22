import React from 'react'
import { Card } from 'react-bootstrap'

function projet(){
    return (
        <Card>
            <Card.Img src={projet.image}></Card.Img>
            <Card.Body>
                <Card.Body>
                    <Card.Title as="h1"> {projet.titre}</Card.Title>
                    <Card.Title as="h1"> {projet.description}</Card.Title>
                </Card.Body>
            </Card.Body>
        </Card>
    )
}

export default projet