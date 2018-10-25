
import React, { Component } from 'react'
import styles from './index.less'
import { connect } from 'dva';
@connect(({ word }) => ({
  word,
})) 
class Word extends Component {
  render() {
  const { word } = this.props;
  const { text } = word;
  
    return (
      <div className={styles.container}>
      hello word
      
        {text}
      
      </div>
    )
  }
}

export default Word;
