'use strict';
/** Requires */
import _  from 'lodash';

/**
 * Please do not add obscenities, swear and other bad words.
 * "dead", "killed", "shot", "raped" (and etc.) also unacceptable.
 *
 * Be positive :)
 */

/** Must be sorted */
export const firstWords = [
  'angry',
  'bad',
  'big',
  'boring',
  'calm',
  'cold',
  'cool',
  'cubic',
  'curious',
  'curved',
  'drunk',
  'dry',
  'eared',
  'even',
  'fancy',
  'far',
  'fine',
  'flat',
  'fresh',
  'glamorous',
  'hard',
  'hot',
  'huge',
  'long',
  'loud',
  'low',
  'noisy',
  'plane',
  'pungent',
  'quiet',
  'round',
  'short',
  'smelly',
  'smooth',
  'soft',
  'square',
  'strong',
  'tall',
  'tasty',
  'warm',
  'wet',
  'wide'
];

export const secondWords = [
  'alien',
  'animal',
  'bird',
  'cat',
  'dog',
  'fish',
  'man',
  'penguin',
  'zombie'
];

export default function fancyID(separator = '-') {
  return [
    _.sample(firstWords),
    _.sample(secondWords)
  ].join(separator);
}
